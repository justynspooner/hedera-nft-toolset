import {
  AccountAllowanceApproveTransaction,
  AccountBalanceQuery,
  AccountId,
  Client,
  ContractId,
  NftId,
  TransferTransaction,
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
];

dotenv.config();

async function main() {
  for (const env of CREATE_TOKEN_REQUIRED_ENVS) {
    if (process.env[env] == null) {
      throw new Error(`environment variable ${env} must be present`);
    }
  }

  // Read the token ID from the command line
  let tokenToAllow = TokenId.fromString(process.argv[2]);

  if (tokenToAllow == null) {
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

  const ownerAccountKey = PrivateKey.fromString(
    <string>process.env.OWNER_PRIVATE_KEY
  );

  const spenderAccountKey = PrivateKey.fromString(
    <string>process.env.SPENDER_PRIVATE_KEY
  );

  const customerAccountId = AccountId.fromString("0.0.3067909");
  const customerAccountKey = PrivateKey.fromString(
    <string>process.env.CUSTOMER_PRIVATE_KEY
  );

  const isMainnet = <string>process.env.HEDERA_NETWORK === "mainnet";

  const client = isMainnet ? Client.forMainnet() : Client.forTestnet();
  client.setOperator(ownerAccountId, ownerAccountKey);

  let transaction = new AccountAllowanceApproveTransaction()
    .approveTokenNftAllowanceAllSerials(
      tokenToAllow,
      ownerAccountId,
      spenderAccountId
    )
    .freezeWith(client);

  // let transaction = new AccountAllowanceApproveTransaction()
  //   .approveTokenNftAllowance(
  //     new NftId(tokenToAllow, 5),
  //     ownerAccountId,
  //     spenderAccountId
  //   )
  //   .freezeWith(client);

  // let transaction = new AccountAllowanceApproveTransaction()
  //   .approveHbarAllowance(
  //     ownerAccountId,
  //     spenderAccountId,
  //     new Hbar(200, HbarUnit.Hbar)
  //   )
  //   .freezeWith(client);

  const signTransaction = await transaction.sign(ownerAccountKey);

  const response = await signTransaction.execute(client);

  console.log(response.toString());

  const receipt = await response.getReceipt(client);

  const transactionStatus = receipt.status;

  console.log(
    "The allowance consensus status is " + transactionStatus.toString()
  );

  // // Test the allowance from the spender account
  // client.setOperator(spenderAccountId, spenderAccountKey);

  // // Create a transaction to transfer the NFT to another account from the spender
  // const transferTransaction = new TransferTransaction()
  //   .addApprovedNftTransfer(
  //     new NftId(tokenToAllow, 10),
  //     ownerAccountId,
  //     customerAccountId
  //   )
  //   .addHbarTransfer(customerAccountId, new Hbar(-5, HbarUnit.Hbar))
  //   .addHbarTransfer(ownerAccountId, new Hbar(5, HbarUnit.Hbar))
  //   .freezeWith(client);

  // //Sign the transaction with the spender account
  // let signedTransferTransaction = await transferTransaction.sign(
  //   spenderAccountKey
  // );

  // // Sign with the customer account
  // signedTransferTransaction = await signedTransferTransaction.sign(
  //   customerAccountKey
  // );

  // //Submit the transaction to a Hedera network
  // const transferTransactionResponse = await signedTransferTransaction.execute(
  //   client
  // );

  // //Request the receipt of the transaction
  // const transferTransactionReceipt =
  //   await transferTransactionResponse.getReceipt(client);

  // //Get the transaction consensus status
  // const transferTransactionStatus = transferTransactionReceipt.status;

  // console.log(
  //   "The transfer consensus status is " + transferTransactionStatus.toString()
  // );

  console.log(
    `🎉 Spender ${spenderAccountId.toString()} can now sell Token ID ${tokenToAllow.toString()} on behalf of owner ${ownerAccountId.toString()}`
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
