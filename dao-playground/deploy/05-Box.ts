import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { Networks, getNetworkValues } from "../hardhat/networks";
import { Box, DaoToken } from "../typechain-types";
import { verify } from "../utils/verify";

const networkValues = getNetworkValues(network.name);

async function deploy() {
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  const args: any[] = [];

  const timelock = await ethers.getContract("DaoTimeLock", deployer);

  const governor = await deploy("Box", {
    from: deployer,
    args,
    log: true,
    // gasLimit: 935298,
  });

  const box = await ethers.getContract<Box>("Box", deployer);

  await box.transferOwnership(await timelock.getAddress());

  if (networkValues.verifyContracts) await verify(governor.address, args);
}

deploy.tags = ["all"];

export default deploy;
