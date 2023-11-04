import {
  AccountCreateTransaction,
  Hbar,
  LocalProvider,
  PrivateKey,
  Wallet,
} from "@hashgraph/sdk";

require("../helpers/load-environment");

const CREATE_ACCOUNT_FROM_EVM_REQUIRED_ENVS = [
  "OPERATOR_ACCOUNT_ID",
  "OPERATOR_PRIVATE_KEY",
];

async function main() {
  for (const env of CREATE_ACCOUNT_FROM_EVM_REQUIRED_ENVS) {
    if (process.env[env] == null) {
      throw new Error(`environment variable ${env} must be present`);
    }
  }

  const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PRIVATE_KEY!);

  const wallet = new Wallet(
    process.env.OPERATOR_ACCOUNT_ID!,
    process.env.OPERATOR_PRIVATE_KEY!,
    new LocalProvider()
  );

  /**
   * Step 1
   *
   * Create an ECSDA private key
   */
  const privateKey = PrivateKey.generateECDSA();
  console.log(`Private key: ${privateKey.toStringDer()}`);

  /**
   * Step 2
   *
   * Extract the ECDSA public key
   */
  const publicKey = privateKey.publicKey;
  console.log(`Public key: ${publicKey.toStringDer()}`);

  /**
   *
   * Step 3
   *
   * Extract the Ethereum public address
   */
  const evmAddress = publicKey.toEvmAddress();
  console.log(`Corresponding evm address: ${evmAddress}`);

  /**
   *
   * Step 4
   *
   * Use the `AccountCreateTransaction`
   *   - Populate `setAlias(evmAddress)` field with the Ethereum public address
   */
  let accountCreateTx = await new AccountCreateTransaction()
    .setInitialBalance(Hbar.fromTinybars(100))
    .setKey(operatorKey)
    .setAlias(evmAddress)
    .freezeWithSigner(wallet);

  accountCreateTx = await accountCreateTx.signWithSigner(wallet);
  accountCreateTx = await accountCreateTx.sign(privateKey);

  const response = await accountCreateTx.executeWithSigner(wallet);

  const provider = wallet.getProvider();

  const transactionReceipt = await provider?.waitForReceipt(response);

  const accountId = transactionReceipt?.accountId;

  console.log(`🔥 ${accountId} created successfully!`);

  process.exit(0);
}

void main().catch((error) => {
  console.error(`🚫 ${error.message}`);
  process.exit(1);
});
