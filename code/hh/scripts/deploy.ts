import { ethers, network, run } from "hardhat";

async function main() {
  const simpleStorageFactory = await ethers.getContractFactory("SimpleStorage");
  const ss = await simpleStorageFactory.deploy();
  await ss.waitForDeployment();

  console.log(`SimpleStorage deployed to ${await ss.getAddress()}`);
  // if (network.name !== "hardhat") {
  //   await verify(await ss.getAddress(), []);
  // }

  console.log("Storing 42...");
  await ss.store(42);
  console.log("Stored 42 at", await ss.getAddress());
  console.log("Retrieving stored value...");
  console.log("Stored value is", (await ss.retreive()).toString());
}

async function verify(address: string, args: any[]) {
  await run("verify:verify", {
    address,
    constructorArguments: args,
  }).catch((error) => {
    console.error(error);
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
