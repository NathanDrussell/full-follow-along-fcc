import { run } from "hardhat";

export const verify = async (address: string, constructorArguments: any[], contract?: string) => {
  console.log("Running verify...");
  try {
    await run("verify:verify", {
      address,
      constructorArguments,
      contract,
    });
  } catch (e) {
    console.log(e);
  }
};
