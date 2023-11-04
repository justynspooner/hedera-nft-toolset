import {
  Hbar,
  HbarUnit,
  LocalProvider,
  Status,
  TopicId,
  TopicMessageSubmitTransaction,
  Wallet,
} from "@hashgraph/sdk";

require("../helpers/load-environment");

const CREATE_TOKEN_REQUIRED_ENVS = [
  "OPERATOR_ACCOUNT_ID",
  "OPERATOR_PRIVATE_KEY",
];

// Set the message that you'd like to submit to the topic
const topicMessage = "Hello Future!";

async function main() {
  for (const env of CREATE_TOKEN_REQUIRED_ENVS) {
    if (process.env[env] == null) {
      throw new Error(`environment variable ${env} must be present`);
    }
  }

  let topicIdToSubmitTo = null;

  try {
    topicIdToSubmitTo = TopicId.fromString(process.argv[2]);
  } catch (error) {
    throw new Error("Invalid Topic ID");
  }

  if (topicIdToSubmitTo == null) {
    throw new Error(
      "Pass the Topic ID to send the message to as the first argument"
    );
  }

  const wallet = new Wallet(
    process.env.OPERATOR_ACCOUNT_ID!,
    process.env.OPERATOR_PRIVATE_KEY!,
    new LocalProvider()
  );

  let transaction = await new TopicMessageSubmitTransaction({
    topicId: topicIdToSubmitTo,
    message: JSON.stringify(topicMessage, null, 4),
  })
    .setMaxTransactionFee(new Hbar(100, HbarUnit.Hbar))
    .freezeWithSigner(wallet);

  transaction = await transaction.signWithSigner(wallet);

  const response = await transaction.executeWithSigner(wallet);

  const provider = wallet.getProvider();

  const receipt = await provider?.waitForReceipt(response);

  if (receipt?.status !== Status.Success) {
    throw new Error("Failed to submit message");
  }

  console.log(`🔥 Message submitted successfully!`);

  process.exit(0);
}

void main().catch((error) => {
  console.error(`🚫 ${error.message}`);
  process.exit(1);
});
