import {
  LocalProvider,
  PrivateKey,
  TokenId,
  TransactionReceiptQuery,
  TransferTransaction,
  Wallet,
} from "@hashgraph/sdk";

require("../helpers/load-environment");

const SEND_HBAR_REQUIRED_ENVS = ["OPERATOR_ACCOUNT_ID", "OPERATOR_PRIVATE_KEY"];

async function main() {
  for (const env of SEND_HBAR_REQUIRED_ENVS) {
    if (process.env[env] == null) {
      throw new Error(`environment variable ${env} must be present`);
    }
  }

  // Send JEDI token
  // const tokenId = TokenId.fromString("0.0.632916");
  const tokenId = TokenId.fromString("0.0.1141841");

  /**
   * Step 1
   *
   * Create an ECSDA private key
   */
  const privateKey = PrivateKey.generateECDSA();
  // const privateKey = PrivateKey.fromStringECDSA("0x7dd232A46297a88109dd2dB5320cbF70028B4873");
  console.log(`Private key: ${privateKey.toStringDer()}`);

  /**
   * Step 2
   *
   * Extract the ECDSA public key
   */
  const publicKey = privateKey.publicKey;
  console.log(`Public key: ${publicKey.toStringDer()}`);

  // 7dd232A46297a88109dd2dB5320cbF70028B4873

  // 44a19044576a0ab9170dee0a51037daf7a0243e3

  /**
   *
   * Step 3
   *
   * Extract the Ethereum public address
   */
  const evmAddress = publicKey.toEvmAddress();
  console.log(`Corresponding evm address: ${evmAddress}`);

  // const evmAddressAliasAccountID = `0.0.${evmAddress}`;

  const evmAddressAliasAccountID = `0.0.7dd232A46297a88109dd2dB5320cbF70028B4873`;

  console.log(
    `Corresponding evm address alias account ID: ${evmAddressAliasAccountID}`
  );

  // // JJ Existing EVM address
  // const rawAddress = "0x7dd232A46297a88109dd2dB5320cbF70028B4873";

  // // Remove the 0x prefix
  // const evmAddress = rawAddress.slice(2);

  // Read the amount of token to send from the command line
  let amountToSend = 50000000;

  const wallet = new Wallet(
    process.env.OPERATOR_ACCOUNT_ID!,
    process.env.OPERATOR_PRIVATE_KEY!,
    new LocalProvider()
  );

  // Send some of the token from the operator account to the new account
  let transferTransaction = await new TransferTransaction()
    .addTokenTransfer(tokenId, process.env.OPERATOR_ACCOUNT_ID!, -amountToSend)
    .addTokenTransfer(tokenId, evmAddressAliasAccountID, amountToSend)
    .freezeWithSigner(wallet);

  transferTransaction = await transferTransaction.signWithSigner(wallet);

  const transferResponse = await transferTransaction.executeWithSigner(wallet);

  const receipt = await new TransactionReceiptQuery()
    .setTransactionId(transferResponse.transactionId)
    .setIncludeChildren(true)
    .executeWithSigner(wallet);

  const hederaAccountId = receipt.children[0]?.accountId?.toString();

  console.log(
    `💸 Sent ${amountToSend} ${tokenId} from ${process.env.OPERATOR_ACCOUNT_ID} to ${evmAddress} (${hederaAccountId})`
  );

  process.exit(0);
}

void main().catch((error) => {
  console.error(`🚫 ${error.message}`);
  process.exit(1);
});
