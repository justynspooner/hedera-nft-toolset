import {
  AccountId,
  Client,
  Hbar,
  NftId,
  PrivateKey,
  TokenBurnTransaction,
  TokenId,
  TokenMintTransaction,
  TokenNftInfo,
  TokenNftInfoQuery,
  TransactionReceipt,
  TransactionResponse,
} from "@hashgraph/sdk";
import { File, NFTStorage } from "nft.storage";
import nfts from "../../input/mintQueue.json";
import validate from "../validators/hip412Validator";
import { StorageHelper } from "./storage.helper";

require("../helpers/load-environment");

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
    console.log(
      `\nMinting ${nfts.length} NFT(s) to token ID ${this.nft.token}`
    );

    for (let i = 0; i < nfts.length; i++) {
      let nft = nfts[i];

      try {
        console.log("----------------------------------------");
        console.log(
          `\n⏳ Processing NFT ${i + 1} of ${nfts.length}: ${nft.name}...`
        );
        let serials: any = await this.generateNft(nft);

        if (serials.length > 1) {
          console.log(
            `\n✅ Successfully minted serials #${serials[0]} to #${
              serials[serials.length - 1]
            }\n`
          );
        } else if (serials.length === 1) {
          console.log(`\n✅ Successfully minted serial #${serials[0]}\n`);
        } else {
          console.log(`\n✅ Successfully minted NFTs\n`);
        }

        // log the location of the token id on hashscan
        console.log(
          `🔗 View on Hash Scan: https://hashscan.io/${process.env.HEDERA_NETWORK}/token/${this.nft.token}`
        );
      } catch (error: any) {
        throw new Error(
          `Error while minting NFT number ${i + 1} - ${nft.name}: ${
            error.message
          }`
        );
      }
    }
  }

  async storeNftMetaData({
    name,
    creator,
    description,
    image,
    type,
    files,
    format = "HIP412@1.0.0",
    properties,
    attributes,
  }: {
    name: string;
    creator: string;
    description: string;
    image: string;
    type: string;
    files: Array<{ uri: string; type: string }>;
    format: any;
    properties: any;
    attributes: Array<{ trait_type: string; value: string | number }>;
  }): Promise<any> {
    const metadata = {
      name,
      creator,
      description,
      image,
      type,
      format,
      ...(files.length ? { files } : {}),
      ...(properties ? { properties } : {}),
      ...(attributes ? { attributes } : {}),
    };

    if (!validate(metadata)) {
      throw new Error(
        `Metadata is not HIP412 compliant:\n${JSON.stringify(
          validate.errors,
          null,
          4
        )}`
      );
    }

    console.log(`\n🙌 Standards FTW! Your metadata passes HIP412 validation!`);
    console.log(`\n📤 Uploading metadata.json to IPFS`);
    console.log(`⏳ Please wait...`);

    const metadataFile = new File(
      [JSON.stringify(metadata, null, 2)],
      "metadata.json",
      {
        type: "application/json",
      }
    );

    const metadataCid = await this.nftClient.storeDirectory([metadataFile]);

    if (metadataCid) {
      return metadataCid;
    } else {
      throw new Error("Unable to store metadata");
    }
  }

  async generateNft(nft: any) {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          quantity = 1,
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

        let isImageURL = false;

        try {
          isImageURL = Boolean(new URL(image));
        } catch (_) {
          isImageURL = false;
        }

        const mediaFiles = [];
        const imageFileName = image.split("/").pop();

        if (!isImageURL) {
          const imageBinary = await new StorageHelper(
            `${MEDIA_ROOT_FILE_PATH}${image}`
          ).readFile();

          const imageFile = new File([imageBinary], imageFileName, { type });

          mediaFiles.push(imageFile);
        }

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

          try {
            if (Boolean(new URL(uri))) continue;
          } catch (_) {}

          const mediaFileName = uri.split("/").pop();

          let binaryData: Buffer = await new StorageHelper(
            `${MEDIA_ROOT_FILE_PATH}${uri}`
          ).readFile();

          const mediaFile = new File([binaryData], mediaFileName, { type });

          mediaFiles.push(mediaFile);
        }

        let cid = "";
        if (mediaFiles.length) {
          console.log(
            `\n📤 Uploading ${mediaFiles.length} media file(s) to IPFS:`
          );

          mediaFiles.forEach((file, index) => {
            console.log(`📄 ${index + 1}: ${file.name}`);
          });

          console.log(`\n⏳ Please wait, this could take a while...`);

          const ipfsCid = await this.nftClient.storeDirectory(mediaFiles);

          const { cid: returnCid } = await this.nftClient.status(ipfsCid);

          console.log(`\n👌 Success uploading to IPFS directory`);
          console.log(
            `🔗 View them here: https://${returnCid}.ipfs.nftstorage.link`
          );

          cid = returnCid;
        } else {
          console.log(`\n📤 No media file(s) require uploading to IPFS:`);
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

        let metadataCid = await this.storeNftMetaData({
          name,
          creator,
          description,
          image: isImageURL ? image : `ipfs://${cid}/${imageFileName}`,
          type,
          files: files.map((file: any) => {
            let isURL = false;
            try {
              isURL = Boolean(new URL(file.uri));
            } catch (_) {}

            if (isURL) return file;
            return {
              ...file,
              uri: `ipfs://${cid}/${file.uri.split("/").pop()}`,
            };
          }),
          format,
          properties: propertiesData,
          attributes,
        });

        if (!metadataCid) {
          reject(
            new Error(
              `Error while storing NFT metadata for NFT ${name} - ${description}`
            )
          );
        }

        console.log(`\n👍 Metadata uploaded to IPFS`);
        console.log(
          `🔗 View it here: https://${metadataCid}.ipfs.nftstorage.link\n`
        );

        const ipfsUrl = `ipfs://${metadataCid}/metadata.json`;

        // minting the proxied nft...
        let nftToken = await this.batchMintNftToken(
          TokenId.fromString(this.nft.token),
          PrivateKey.fromString(this.nft.supplyKey),
          ipfsUrl,
          quantity
        );

        // finally, resolving the proxied nft token...
        resolve(nftToken);
      } catch (error) {
        reject(error);
      }
    });
  }

  async mintNft({
    tokenId,
    metadataArray,
    supplyKey,
  }: {
    tokenId: TokenId;
    metadataArray: Array<Buffer>;
    supplyKey: PrivateKey;
  }): Promise<TransactionResponse> {
    const transaction = new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMaxTransactionFee(new Hbar(100))
      .setMetadata(metadataArray)
      .freezeWith(this.client);

    const signTx = await transaction.sign(supplyKey);
    const txResponse = await signTx.execute(this.client);
    // const receipt = await txResponse.getReceipt(this.client);

    // if (receipt.status !== Status.Success) {
    //   throw new Error(`Error while minting NFT - ${receipt.toString()}`);
    // }

    return txResponse;
  }

  async batchMintNftToken(
    tokenId: TokenId,
    supplyKey: PrivateKey,
    CID: string,
    quantity: number
  ): Promise<Array<Long>> {
    const batchSize = 10;
    const mintedSerialNumbers: Array<Long> = [];
    const remainder = quantity % batchSize;

    // Loop through the quantity in batches of 10
    for (let i = 0; i < quantity - remainder; i += batchSize) {
      const metadataArray: Array<Buffer> = Array(batchSize).fill(
        Buffer.from(CID)
      );

      const receipt = await this.mintNft({ tokenId, metadataArray, supplyKey });

      // mintedSerialNumbers.push(...receipt.serials);

      console.log(
        `🖌️ Minted ${i + batchSize}/${quantity} serials for token ${tokenId}`
      );
    }

    // Mint the remainder
    if (remainder > 0) {
      const metadataArray: Array<Buffer> = Array(remainder).fill(
        Buffer.from(CID)
      );

      const receipt = await this.mintNft({ tokenId, metadataArray, supplyKey });

      // mintedSerialNumbers.push(...receipt.serials);

      console.log(
        `🖌️ Minted ${quantity}/${quantity} serials for token ${tokenId}`
      );
    }
    return mintedSerialNumbers;
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
