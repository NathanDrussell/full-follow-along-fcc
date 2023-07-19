import { run } from "hardhat";

export const verify = async (address: string, constructorArguments: any[]) => {
  console.log("Running verify...");
  try {
    await run("verify:verify", {
      address,
      constructorArguments,
    });
  } catch (e) {
    console.log(e);
  }
};
