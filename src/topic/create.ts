import {
  Wallet,
  LocalProvider,
  PrivateKey,
  Hbar,
  HbarUnit,
  TopicCreateTransaction,
  Status,
} from "@hashgraph/sdk";

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

  const operatorPrivateKey = PrivateKey.fromString(
    process.env.OPERATOR_PRIVATE_KEY!
  );

  let transaction = await new TopicCreateTransaction({
    adminKey: operatorPrivateKey.publicKey,
    topicMemo: "Vote",
  })
    .setMaxTransactionFee(new Hbar(100, HbarUnit.Hbar))
    .freezeWithSigner(wallet);

  transaction = await transaction.signWithSigner(wallet);

  const response = await transaction.executeWithSigner(wallet);

  const provider = wallet.getProvider();

  const receipt = await provider?.waitForReceipt(response);

  if (receipt?.status !== Status.Success) {
    throw new Error("Failed to create topic");
  }

  const topicId = receipt?.topicId?.toString();

  console.log(`🔥 Topic with ID ${topicId} created successfully!`);

  process.exit(0);
}

void main().catch((error) => {
  console.error(`🚫 ${error.message}`);
  process.exit(1);
});
