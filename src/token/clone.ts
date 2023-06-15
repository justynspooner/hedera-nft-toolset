import {
  Wallet,
  LocalProvider,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  PrivateKey,
  Hbar,
  HbarUnit,
  TokenId,
  TokenMintTransaction,
  Status,
} from "@hashgraph/sdk";
import axios from "axios";

require("../helpers/load-environment");

const CREATE_TOKEN_REQUIRED_ENVS = [
  "OPERATOR_ACCOUNT_ID",
  "OPERATOR_PRIVATE_KEY",
  "TREASURY_ACCOUNT_ID",
  "TREASURY_PRIVATE_KEY",
  "AUTO_RENEW_ACCOUNT_ID",
];

async function main() {
  for (const env of CREATE_TOKEN_REQUIRED_ENVS) {
    if (process.env[env] == null) {
      throw new Error(`environment variable ${env} must be present`);
    }
  }

  // Read the token ID from the command line
  let validatedTokenIdToClone: TokenId;

  try {
    const tokenIdToClone = process.argv[2];
    validatedTokenIdToClone = TokenId.fromString(tokenIdToClone);
  } catch (error) {
    throw new Error("Invalid Token ID");
  }

  if (validatedTokenIdToClone == null) {
    throw new Error("Pass the token ID to clone as the first argument");
  }

  console.log(
    `🐑🐑 Cloning Token ID from mainnet ${validatedTokenIdToClone.toString()} to testnet…`
  );

  const { data: tokenInfo } = await axios.get(
    `https://mainnet-public.mirrornode.hedera.com/api/v1/tokens/${validatedTokenIdToClone.toString()}`
  );

  const metadata: Array<Uint8Array> = [];
  let nextPath = `/api/v1/tokens/${validatedTokenIdToClone.toString()}/nfts`;
  while (nextPath) {
    const { data } = await axios.get(
      `https://mainnet-public.mirrornode.hedera.com${nextPath}`
    );

    const nftMetadata: Array<Uint8Array> = data.nfts.map((nft: any) =>
      Buffer.from(nft.metadata, "base64")
    );

    metadata.push(...nftMetadata);

    nextPath = data?.links?.next || null;
  }

  // Reverse the metadata so that the NFTs are minted in the same order as mainnet
  metadata.reverse();

  const wallet = new Wallet(
    process.env.OPERATOR_ACCOUNT_ID!,
    process.env.OPERATOR_PRIVATE_KEY!,
    new LocalProvider()
  );

  // Load in the treasury account key
  const treasuryPrivateKey = PrivateKey.fromString(
    process.env.TREASURY_PRIVATE_KEY!
  );

  // Create a new token on testnet with the same details

  const { name, symbol, decimals } = tokenInfo;

  // Build the transaction
  let transaction = await new TokenCreateTransaction({
    tokenName: name,
    tokenSymbol: symbol,
    decimals: decimals,
    initialSupply: 0,
    adminKey: treasuryPrivateKey.publicKey,
    supplyKey: treasuryPrivateKey.publicKey,
    treasuryAccountId: process.env.TREASURY_ACCOUNT_ID!,
    autoRenewAccountId: process.env.AUTO_RENEW_ACCOUNT_ID!,
    tokenType: TokenType.NonFungibleUnique,
    supplyType: TokenSupplyType.Infinite,
  })
    .setMaxTransactionFee(new Hbar(100, HbarUnit.Hbar))
    .freezeWithSigner(wallet);

  transaction = await transaction.signWithSigner(wallet);
  transaction = await transaction.sign(treasuryPrivateKey);

  const response = await transaction.executeWithSigner(wallet);

  const provider = wallet.getProvider();

  const transactionReceipt = await provider?.waitForReceipt(response);

  const newTokenId = transactionReceipt?.tokenId;

  if (newTokenId == null) {
    throw new Error("Failed to create token");
  }

  const batchMetadata = [];

  for (let i = 0; i < metadata.length; i += 10) {
    batchMetadata.push(metadata.slice(i, i + 10));
  }

  for (let i = 0; i < batchMetadata.length; i++) {
    let transaction = await new TokenMintTransaction()
      .setTokenId(newTokenId)
      .setMaxTransactionFee(new Hbar(100, HbarUnit.Hbar))
      .setMetadata(batchMetadata[i])
      .freezeWithSigner(wallet);

    transaction = await transaction.sign(treasuryPrivateKey);
    transaction = await transaction.signWithSigner(wallet);

    const response = await transaction.executeWithSigner(wallet);

    const provider = wallet.getProvider();

    const receipt = await provider?.waitForReceipt(response);

    if (receipt?.status !== Status.Success) {
      throw new Error("Failed to mint NFTs");
    }
  }

  console.log(
    `🎉 Token ID ${newTokenId.toString()} created on testnet with ${
      metadata.length
    } NFTs minted.`
  );

  process.exit(0);
}

void main().catch((error) => {
  console.error(`🚫 ${error.message}`);
  process.exit(1);
});
