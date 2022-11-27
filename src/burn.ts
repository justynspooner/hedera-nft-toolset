import { NftHelper } from "./helpers/nft.helper";
import serialsToBurn from "../input/serialsToBurn.json";

async function main() {
  let nftHelper = new NftHelper();
  if (!serialsToBurn) {
    const exampleBurnConfig = {
      tokenId: "0.0.1234567",
      serialsToBurn: [1, 2, 3],
      privateSupplyKey: 12345678901234567890,
    };
    console.log(
      `No serials to burn. Please add serials to burn in "./input/serialsToBurn.json". \n Example: \n ${JSON.stringify(
        exampleBurnConfig,
        null,
        2
      )}`
    );
    return;
  }

  await nftHelper.burnNftTokens(serialsToBurn);
}

main()
  .then(() => {
    console.log(
      `🔥 NFTs ${serialsToBurn.serials} have been successfully burned`
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error(`🚫 ${error.message}`);
    process.exit(1);
  });
