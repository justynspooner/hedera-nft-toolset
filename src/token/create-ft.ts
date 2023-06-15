import {
  Wallet,
  LocalProvider,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  PrivateKey,
  Hbar,
  HbarUnit,
} from "@hashgraph/sdk";
import fs from "fs";
import validate from "../validators/tokenInfoValidator";
import { InputTokenInfo } from "../../types";

require("../helpers/load-environment");

const CREATE_TOKEN_REQUIRED_ENVS = [
  "OPERATOR_ACCOUNT_ID",
  "OPERATOR_PRIVATE_KEY",
  "TREASURY_ACCOUNT_ID",
  "TREASURY_PRIVATE_KEY",
  "AUTO_RENEW_ACCOUNT_ID",
  "AUTO_RENEW_PRIVATE_KEY",
];

async function main() {
  for (const env of CREATE_TOKEN_REQUIRED_ENVS) {
    if (process.env[env] == null) {
      throw new Error(`environment variable ${env} must be present`);
    }
  }

  // Read in the token info from the JSON file
  const tokenInfo: InputTokenInfo = JSON.parse(
    fs.readFileSync("./input/FT_tokenInfo.json", "utf8")
  );

  // Check that token info is valid
  validate(tokenInfo);

  const { tokenName, tokenSymbol, decimals, maxSupply, initialSupply } =
    tokenInfo;

  const wallet = new Wallet(
    process.env.OPERATOR_ACCOUNT_ID!,
    process.env.OPERATOR_PRIVATE_KEY!,
    new LocalProvider()
  );

  // Load in the treasury account key
  const treasuryPrivateKey = PrivateKey.fromString(
    process.env.TREASURY_PRIVATE_KEY!
  );

  // Load in the treasury account key
  const autoRenewPrivateKey = PrivateKey.fromString(
    process.env.AUTO_RENEW_PRIVATE_KEY!
  );

  // Create a new supply key
  const supplyPrivateKeyString = process.env.SUPPLY_PRIVATE_KEY;
  let supplyPrivateKey: PrivateKey;

  if (supplyPrivateKeyString) {
    supplyPrivateKey = PrivateKey.fromString(supplyPrivateKeyString);
  } else {
    supplyPrivateKey = await PrivateKey.generate();
  }

  const supplyPublicKey = supplyPrivateKey.publicKey;

  // Build the transaction
  let transaction = await new TokenCreateTransaction({
    tokenName,
    tokenSymbol,
    decimals,
    initialSupply,
    maxSupply,
    treasuryAccountId: process.env.TREASURY_ACCOUNT_ID!,
    supplyKey: supplyPublicKey,
    autoRenewAccountId: process.env.AUTO_RENEW_ACCOUNT_ID!,
    tokenType: TokenType.FungibleCommon,
    supplyType: TokenSupplyType.Finite,
  })
    .setMaxTransactionFee(new Hbar(100, HbarUnit.Hbar))
    .freezeWithSigner(wallet);

  transaction = await transaction.signWithSigner(wallet);
  transaction = await transaction.sign(supplyPrivateKey);
  transaction = await transaction.sign(treasuryPrivateKey);
  transaction = await transaction.sign(autoRenewPrivateKey);

  const response = await transaction.executeWithSigner(wallet);

  const provider = wallet.getProvider();

  const transactionReceipt = await provider?.waitForReceipt(response);

  const tokenId = transactionReceipt?.tokenId;

  // Save the keys to a file
  const secretTokenInfo = {
    tokenId: tokenId?.toString(),
    tokenName,
    tokenSymbol,
    decimals,
    maxSupply,
    initialSupply,
    supplyKey: {
      privateKey: supplyPrivateKey.toString(),
      publicKey: supplyPublicKey.toString(),
    },
  };

  // Create output folder if it doesn't exist
  if (!fs.existsSync("./output")) {
    fs.mkdirSync("./output");
  }

  // Save the keys to a file
  fs.writeFileSync(
    `./output/fungible-token-secrets-${tokenId}.json`,
    JSON.stringify(secretTokenInfo, null, 2)
  );

  console.log(
    `🔥 ${tokenName} token ${tokenId} created successfully!\nIMPORTANT: Backup "../output/fungible-token-secrets-${tokenId}.json" to a safe place. You'll need the token ID and supply private key to mint tokens.`
  );

  process.exit(0);
}

void main().catch((error) => {
  console.error(`🚫 ${error.message}`);
  process.exit(1);
});
