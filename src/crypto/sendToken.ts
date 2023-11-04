import {
  AccountId,
  LocalProvider,
  Status,
  TokenId,
  TransferTransaction,
  Wallet,
} from "@hashgraph/sdk";

require("../helpers/load-environment");

const SEND_TOKEN_REQUIRED_ENVS = [
  "OPERATOR_ACCOUNT_ID",
  "OPERATOR_PRIVATE_KEY",
];

async function main() {
  for (const env of SEND_TOKEN_REQUIRED_ENVS) {
    if (process.env[env] == null) {
      throw new Error(`environment variable ${env} must be present`);
    }
  }

  // Read the token ID from the command line
  let validatedTokenIdToSend: TokenId;

  try {
    const tokenIdToSendTo = process.argv[2];
    validatedTokenIdToSend = TokenId.fromString(tokenIdToSendTo);
  } catch (error) {
    throw new Error("Invalid Token ID");
  }

  if (validatedTokenIdToSend == null) {
    throw new Error("Pass the Token ID to send as the first argument");
  }

  // Read the account ID from the command line
  let validatedAccountIdToSendTo: AccountId;

  try {
    const accountIdToSendTo = process.argv[3];
    validatedAccountIdToSendTo = AccountId.fromString(accountIdToSendTo);
  } catch (error) {
    throw new Error("Invalid Account ID");
  }

  if (validatedAccountIdToSendTo == null) {
    throw new Error("Pass the Account ID to send to as the second argument");
  }

  // Read the amount of HBAR to send from the command line
  let validatedAmountToSend: number;

  try {
    const amountToSend = process.argv[4];
    validatedAmountToSend = Number(amountToSend);
  } catch (error) {
    throw new Error("Invalid amount to send");
  }

  if (validatedAmountToSend == null) {
    throw new Error(
      "Pass the amount of the token to send as the third argument"
    );
  }

  const wallet = new Wallet(
    process.env.OPERATOR_ACCOUNT_ID!,
    process.env.OPERATOR_PRIVATE_KEY!,
    new LocalProvider()
  );

  let transferTransaction = await new TransferTransaction()
    .addTokenTransfer(
      validatedTokenIdToSend,
      process.env.OPERATOR_ACCOUNT_ID!,
      -validatedAmountToSend
    )
    .addTokenTransfer(
      validatedTokenIdToSend,
      validatedAccountIdToSendTo,
      validatedAmountToSend
    )
    .freezeWithSigner(wallet);

  transferTransaction = await transferTransaction.signWithSigner(wallet);

  const transferResponse = await transferTransaction.executeWithSigner(wallet);

  const provider = wallet.provider;

  const transferReceipt = await provider?.waitForReceipt(transferResponse);

  if (transferReceipt?.status !== Status.Success) {
    throw new Error("Failed to transfer token");
  }

  console.log(
    `💸 Sent ${validatedAmountToSend} ${validatedTokenIdToSend} from ${process.env.OPERATOR_ACCOUNT_ID} to ${validatedAccountIdToSendTo}`
  );

  process.exit(0);
}

void main().catch((error) => {
  console.error(`🚫 ${error.message}`);
  process.exit(1);
});
