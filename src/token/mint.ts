import { NftHelper } from "../helpers/nft.helper";

async function main() {
  let nftHelper = new NftHelper();
  return await nftHelper.mintNfts();
}

main()
  .then(() => {
    console.log("🔥 All queued NFTs have been minted successfully! 🎉");
    process.exit(0);
  })
  .catch((error) => {
    console.error(`🚫 ${error.message}`);
    process.exit(1);
  });
