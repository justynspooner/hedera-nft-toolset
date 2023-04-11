import {
  Wallet,
  LocalProvider,
  Hbar,
  HbarUnit,
  Status,
  TopicId,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";

require("../helpers/load-environment");

const CREATE_TOKEN_REQUIRED_ENVS = [
  "OPERATOR_ACCOUNT_ID",
  "OPERATOR_PRIVATE_KEY",
];

const ruleDefinitionMessage = {
  type: "define-rules",
  title: "JJ",
  description: "JJ Governance Voting Stream",
  tokenId: "0.0.624505",
  minVotingThreshold: 0.1,
  minimumVotingPeriod: 1,
  minimumStandoffPeriod: 0,
};

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
    message: JSON.stringify(ruleDefinitionMessage, null, 4),
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
