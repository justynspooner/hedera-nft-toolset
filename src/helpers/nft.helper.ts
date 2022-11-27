import { NFTStorage, File } from "nft.storage";
import {
  AccountId,
  Client,
  NftId,
  PrivateKey,
  TokenBurnTransaction,
  TokenId,
  TokenMintTransaction,
  TokenNftInfo,
  TokenNftInfoQuery,
  TransactionReceipt,
} from "@hashgraph/sdk";
import { StorageHelper } from "./storage.helper";
import nfts from "../../input/mintQueue.json";
import validate from "../validators/hip412Validator";

require("dotenv").config();

const MEDIA_ROOT_FILE_PATH = "./input/media/";

export class NftHelper {
  private nftStorageToken: string = <string>process.env.NFT_STORAGE_KEY;
  private shouldMergeAttributesToProperties: boolean =
    process.env.MERGE_ATTRIBUTES_TO_PROPERTIES === "true";

  private network = process.env.HEDERA_NETWORK;

  private operator = {
    accountId: <string>process.env.OPERATOR_ACCOUNT_ID,
    privateKey: <string>process.env.OPERATOR_PRIVATE_KEY,
  };

  private nft = {
    token: <string>process.env.NFT_TOKEN_ID,
    supplyKey: <string>process.env.NFT_SUPPLY_PRIVATE_KEY,
  };

  private nftClient: NFTStorage;
  private client: Client;

  constructor() {
    this.nftClient = new NFTStorage({ token: this.nftStorageToken });

    switch (this.network) {
      case "mainnet":
        this.client = Client.forMainnet();
        this.client.setMirrorNetwork(
          "mainnet-public.mirrornode.hedera.com:443"
        );
        break;
      case "testnet":
        this.client = Client.forTestnet();
        break;
      case "custom":
      default:
        const node = {
          [<string>process.env.CUSTOM_NODE]: new AccountId(
            Number(process.env.CUSTOM_ACCOUNT_ID)
          ),
        };
        this.client = Client.forNetwork(node).setMirrorNetwork(
          <string>process.env.CUSTOM_MIRROR
        );
        break;
    }

    this.client.setOperator(this.operator.accountId, this.operator.privateKey);
  }

  async mintNfts() {
    return new Promise(async (resolve, reject) => {
      console.log(
        `\nMinting ${nfts.length} NFTs to token ID ${this.nft.token}\n`
      );

      for (let i = 0; i < nfts.length; i++) {
        let nft = nfts[i];

        try {
          console.log(
            `⏳ Processing NFT ${i + 1} of ${nfts.length}: ${nft.name}...`
          );
          let nftToken: any = await this.generateNft(nft);
          console.log(
            `✅ Successfully minted serial ${nftToken.serials[0].toString()}\n`
          );
        } catch (error: any) {
          reject(
            new Error(
              `Error while minting NFT number ${i + 1} - ${nft.name}: ${
                error.message
              }`
            )
          );
          break;
        }
      }
      resolve(true);
    });
  }

  async storeNftMetaData({
    name,
    creator,
    description,
    binaryImage,
    imageType,
    fileData,
    format = "HIP412@1.0.0",
    properties,
    attributes,
  }: {
    name: string;
    creator: string;
    description: string;
    binaryImage: any;
    imageType: string;
    fileData: Array<{ uri: Buffer; type: string }>;
    format: any;
    properties: any;
    attributes: Array<{ trait_type: string; value: string | number }>;
  }): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const imageFileName = imageType.replace("/", ".");
        const imageFile = new File([binaryImage], imageFileName, {
          type: imageType,
        });

        const files = fileData.map((file) => {
          const { uri: binaryData, type } = file;

          const fileName = type.replace("/", ".");

          const uri = new File([binaryData], fileName, { type });

          return {
            ...file,
            uri,
          };
        });

        const metadata = {
          name,
          creator,
          description,
          image: imageFile,
          type: imageType,
          format,
          ...(files.length ? { files } : {}),
          ...(properties ? { properties } : {}),
          ...(attributes ? { attributes } : {}),
        };

        const { token, car } = await NFTStorage.encodeNFT(metadata);

        // Stringifying converts all the URLs to strings
        const generatedMetadata = JSON.stringify(token.data, null, 4);
        // We then parse it back to an object so we can validate it
        const parsedMetadata = JSON.parse(generatedMetadata);

        if (!validate(parsedMetadata)) {
          throw new Error(
            `Metadata is not HIP412 compliant:\n${JSON.stringify(
              validate.errors,
              null,
              4
            )}`
          );
        }

        console.log(`🙌 Metadata passes HIP412 validation`);

        const cid = await this.nftClient.storeCar(car);
        if (token.url) {
          resolve(token.url);
        } else {
          reject(new Error("Unable to store metadata"));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  async generateNft(nft: any) {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          name,
          image,
          creator,
          type,
          description,
          format,
          properties,
          attributes,
          files = [],
        } = nft;

        const binaryImage = await new StorageHelper(
          `${MEDIA_ROOT_FILE_PATH}${image}`
        ).readFile();

        const fileData: Array<{
          uri: Buffer;
          type: string;
        }> = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          let { uri, type } = file;

          if (!uri || !type) {
            reject(
              new Error(
                `Invalid file data for NFT ${name} - uri: ${uri} - type: ${type}`
              )
            );
          }
          let binaryData: Buffer = await new StorageHelper(
            `${MEDIA_ROOT_FILE_PATH}${uri}`
          ).readFile();

          fileData.push({
            ...file,
            uri: binaryData,
          });
        }

        let propertiesData = properties;

        if (this.shouldMergeAttributesToProperties) {
          // Map the attributes to properties
          propertiesData = {
            ...properties,
            ...attributes.reduce(
              (
                acc: Record<string, string | number>,
                {
                  trait_type,
                  value,
                }: { trait_type: string; value: string | number }
              ) => ({
                ...acc,
                [trait_type]: value,
              }),
              {}
            ),
          };
        }

        // saving the metadata for the proxied nft...
        let ipfsUrl = await this.storeNftMetaData({
          name,
          creator,
          description,
          binaryImage,
          imageType: type,
          fileData,
          format,
          properties: propertiesData,
          attributes,
        });

        if (!ipfsUrl) {
          reject(
            new Error(
              `Error while storing NFT metadata for NFT ${name} - ${description}`
            )
          );
        }

        console.log(`👍 Metadata uploaded to IPFS ${ipfsUrl}`);

        // minting the proxied nft...
        let nftToken = await this.mintNftToken(
          TokenId.fromString(this.nft.token),
          PrivateKey.fromString(this.nft.supplyKey),
          ipfsUrl
        );

        // finally, resolving the proxied nft token...
        resolve(nftToken);
      } catch (error) {
        reject(error);
      }
    });
  }

  async mintNftToken(
    tokenId: TokenId,
    supplyKey: PrivateKey,
    CID: string
  ): Promise<TransactionReceipt> {
    return new Promise(async (resolve, reject) => {
      try {
        const transaction = new TokenMintTransaction()
          .setTokenId(tokenId)
          .addMetadata(Buffer.from(CID))
          .freezeWith(this.client);

        const signTx = await transaction.sign(supplyKey);
        const txResponse = await signTx.execute(this.client);
        const receipt = await txResponse.getReceipt(this.client);

        resolve(receipt);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getNftInfo(
    tokenId: TokenId,
    serialNumber: number
  ): Promise<TokenNftInfo[]> {
    return new Promise(async (resolve, reject) => {
      try {
        let nftId = new NftId(tokenId, serialNumber);
        let nftInfos = await new TokenNftInfoQuery()
          .setNftId(nftId)
          .execute(this.client);

        resolve(nftInfos);
      } catch (error) {
        reject(error);
      }
    });
  }

  async burnNftTokens({
    tokenId,
    serials,
    privateSupplyKey,
  }: {
    tokenId: string;
    serials: number[];
    privateSupplyKey: string;
  }): Promise<TransactionReceipt> {
    return new Promise(async (resolve, reject) => {
      console.log(`Burning ${serials.length} NFTs...`);
      console.log(`TokenId: ${tokenId}`);
      console.log(`Serials: ${serials}`);

      try {
        const transaction = new TokenBurnTransaction()
          .setTokenId(TokenId.fromString(tokenId))
          .setSerials(serials)
          .freezeWith(this.client);

        const signTx = await transaction.sign(
          PrivateKey.fromString(privateSupplyKey)
        );
        const txResponse = await signTx.execute(this.client);
        const receipt = await txResponse.getReceipt(this.client);
        resolve(receipt);
      } catch (error) {
        reject(error);
      }
    });
  }
}
