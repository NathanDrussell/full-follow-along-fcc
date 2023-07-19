import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { Networks, getNetworkValues } from "../hardhat/networks";
import { DaoToken } from "../typechain-types";
import { verify } from "../utils/verify";

const networkValues = getNetworkValues(network.name);

async function deploy() {
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  const args: any[] = [
    //   uint256 minDelay,
    networkValues.contractValues.DaoTimeLock.minDelay,
    //   address[] memory proposers,
    [],
    //   address[] memory executors
    [],
  ];

  const timeLock = await deploy("DaoTimeLock", {
    from: deployer,
    args,
    log: true,
  });

  if (networkValues.verifyContracts) await verify(timeLock.address, args);
}

deploy.tags = ["all"];

export default deploy;
