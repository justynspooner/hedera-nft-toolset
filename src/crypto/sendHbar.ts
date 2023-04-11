import {
  Wallet,
  LocalProvider,
  Hbar,
  TransferTransaction,
  Status,
  TokenId,
  AccountId,
} from "@hashgraph/sdk";
import dotenv from "dotenv";

dotenv.config();

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

  // Read the account ID from the command line
  let validatedAccountIdToSendTo: AccountId;

  try {
    const accountIdToSendTo = process.argv[2];
    validatedAccountIdToSendTo = AccountId.fromString(accountIdToSendTo);
  } catch (error) {
    throw new Error("Invalid Account ID");
  }

  if (validatedAccountIdToSendTo == null) {
    throw new Error(
      "Pass the Account ID to send HBAR to as the first argument"
    );
  }

  // Read the amount of HBAR to send from the command line
  let validatedAmountToSend: number;

  try {
    const amountToSend = process.argv[3];
    validatedAmountToSend = Number(amountToSend);
  } catch (error) {
    throw new Error("Invalid amount to send");
  }

  if (validatedAmountToSend == null) {
    throw new Error("Pass the amount of HBAR to send as the second argument");
  }

  const wallet = new Wallet(
    process.env.OPERATOR_ACCOUNT_ID!,
    process.env.OPERATOR_PRIVATE_KEY!,
    new LocalProvider()
  );

  // Send some HBAR from the operator account to the new account
  let transferTransaction = await new TransferTransaction()
    .addHbarTransfer(
      process.env.OPERATOR_ACCOUNT_ID!,
      new Hbar(-validatedAmountToSend)
    )
    .addHbarTransfer(
      validatedAccountIdToSendTo,
      new Hbar(validatedAmountToSend)
    )
    .freezeWithSigner(wallet);

  transferTransaction = await transferTransaction.signWithSigner(wallet);

  const transferResponse = await transferTransaction.executeWithSigner(wallet);

  const provider = wallet.provider;

  const transferReceipt = await provider?.waitForReceipt(transferResponse);

  if (transferReceipt?.status !== Status.Success) {
    throw new Error("Failed to transfer HBAR");
  }

  console.log(
    `💸 Sent ${validatedAmountToSend} Hbar from ${process.env.OPERATOR_ACCOUNT_ID} to ${validatedAccountIdToSendTo}`
  );

  process.exit(0);
}

void main().catch((error) => {
  console.error(`🚫 ${error.message}`);
  process.exit(1);
});
