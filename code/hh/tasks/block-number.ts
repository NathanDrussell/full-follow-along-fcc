import "@nomicfoundation/hardhat-toolbox";
import { task } from "hardhat/config";

task("block-number", "Prints the current block number").setAction(async (taskArgs, hre) => {
  // @ts-expect-error
  const block = await hre.ethers.provider.getBlockNumber();
  console.log("Current block number: " + block);
});
