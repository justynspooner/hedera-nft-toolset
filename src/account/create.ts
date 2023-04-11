import {
  Wallet,
  LocalProvider,
  PrivateKey,
  CustomRoyaltyFee,
  Hbar,
  HbarUnit,
  AccountCreateTransaction,
} from "@hashgraph/sdk";
import fs from "fs";

require("../helpers/load-environment");

const CREATE_TOKEN_REQUIRED_ENVS = [
  "OPERATOR_ACCOUNT_ID",
  "OPERATOR_PRIVATE_KEY",
];

async function main() {
  for (const env of CREATE_TOKEN_REQUIRED_ENVS) {
    if (process.env[env] == null) {
      throw new Error(`environment variable ${env} must be present`);
    }
  }

  const wallet = new Wallet(
    process.env.OPERATOR_ACCOUNT_ID!,
    process.env.OPERATOR_PRIVATE_KEY!,
    new LocalProvider()
  );

  // Create a new supply key
  const accountPrivateKey = await PrivateKey.generate();
  const accountPublicKey = accountPrivateKey.publicKey;

  const customFees: Array<CustomRoyaltyFee> = [];

  // Build the transaction
  let transaction = await new AccountCreateTransaction({
    key: accountPublicKey,
  })
    .setMaxTransactionFee(new Hbar(100, HbarUnit.Hbar))
    .freezeWithSigner(wallet);

  transaction = await transaction.signWithSigner(wallet);
  transaction = await transaction.sign(accountPrivateKey);

  const response = await transaction.executeWithSigner(wallet);

  const provider = wallet.getProvider();

  const transactionReceipt = await provider?.waitForReceipt(response);

  const accountId = transactionReceipt?.accountId;

  // Save the new account details to a file
  const secretAccountInfo = {
    accountId: accountId?.toString(),
    privateKey: accountPrivateKey.toString(),
  };

  // Create output folder if it doesn't exist
  if (!fs.existsSync("./output")) {
    fs.mkdirSync("./output");
  }

  // Save the keys to a file
  fs.writeFileSync(
    `./output/account-secrets-${accountId}.json`,
    JSON.stringify(secretAccountInfo, null, 2)
  );

  console.log(
    `🔥 ${accountId} created successfully!\nIMPORTANT: Backup "../output/account-secrets-${accountId}.json" to a safe place.`
  );

  process.exit(0);
}

void main().catch((error) => {
  console.error(`🚫 ${error.message}`);
  process.exit(1);
});
