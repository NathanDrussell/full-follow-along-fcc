import { ethers, getNamedAccounts } from "hardhat";
import { Marketplace, SimpleNFT } from "../typechain-types";

async function mint() {
  const { seller } = await getNamedAccounts();
  const nft = await ethers.getContract<SimpleNFT>("SimpleNFT", seller);
  const marketplace = await ethers.getContract<Marketplace>(
    "Marketplace",
    seller
  );
  const tx = await nft.mint();
  await tx.wait();

  const nextTokenId = await nft.tokenId();
  const approveTx = await nft.approve(
    marketplace.getAddress(),
    nextTokenId - 1n
  );

  await approveTx.wait();

  const listTx = await marketplace.listAsset(
    await nft.getAddress(),
    nextTokenId - 1n,
    ethers.parseEther("0.02")
  );

  await listTx.wait();

  // COnfirmation

  const asset = await marketplace.getListing(
    await nft.getAddress(),
    nextTokenId - 1n
  );
  console.log({
    address: await nft.getAddress(),
    token: nextTokenId - 1n,
  });
  console.log(asset);
}

mint()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
