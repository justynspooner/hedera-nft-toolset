import {
  AccountAllowanceApproveTransaction,
  AccountId,
  NftId,
} from "@hashgraph/sdk";

import {
  Wallet,
  LocalProvider,
  PrivateKey,
  Hbar,
  HbarUnit,
  TokenId,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

const CREATE_TOKEN_REQUIRED_ENVS = [
  "OPERATOR_ACCOUNT_ID",
  "OPERATOR_PRIVATE_KEY",
  "TREASURY_ACCOUNT_ID",
  "TREASURY_PRIVATE_KEY",
  "AUTO_RENEW_ACCOUNT_ID",
];

dotenv.config();

async function main() {
  for (const env of CREATE_TOKEN_REQUIRED_ENVS) {
    if (process.env[env] == null) {
      throw new Error(`environment variable ${env} must be present`);
    }
  }

  // Read the token ID from the command line
  let tokenId = TokenId.fromString(process.argv[2]);

  if (tokenId == null) {
    throw new Error("Pass the token ID as the first argument");
  }

  let ownerAccountId = AccountId.fromString(process.argv[3]);

  if (ownerAccountId == null) {
    throw new Error("Pass the owner account ID as the second argument");
  }

  let spenderAccountId = AccountId.fromString(process.argv[4]);

  if (spenderAccountId == null) {
    throw new Error("Pass the spender account ID as the third argument");
  }

  const wallet = new Wallet(
    process.env.OPERATOR_ACCOUNT_ID!,
    process.env.OPERATOR_PRIVATE_KEY!,
    new LocalProvider()
  );

  let transaction = await new AccountAllowanceApproveTransaction()
    .approveTokenNftAllowanceAllSerials("0.0.15698", "0.0.1792", "0.0.2669")
    .freezeWithSigner(wallet);

  transaction = await transaction.signWithSigner(wallet);

  const response = await transaction.executeWithSigner(wallet);

  console.log(response.toString());

  const provider = wallet.getProvider();

  const transactionReceipt = await provider?.waitForReceipt(response);

  console.log(transactionReceipt);

  console.log(
    `🎉 Spender ${spenderAccountId.toString()} can now sell Token ID ${tokenId.toString()} on behalf of owner ${ownerAccountId.toString()}`
  );

  console.log(
    `You can check the allowances here https://testnet.mirrornode.hedera.com/api/v1/accounts/${ownerAccountId.toString()}/allowances/tokens`
  );

  process.exit(0);
}

void main().catch((error) => {
  console.error(`🚫 ${error.message}`);
  process.exit(1);
});
