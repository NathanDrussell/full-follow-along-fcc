import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { Networks, getNetworkValues } from "../hardhat/networks";
import { DaoToken } from "../typechain-types";
import { verify } from "../utils/verify";

const networkValues = getNetworkValues(network.name);

console.log("Deploying on the network:", network.name);

async function deploy() {
  const { deployer } = await getNamedAccounts();
  const { deploy, get } = deployments;

  const daoToken = await get("DaoToken");
  const daoTimeLock = await get("DaoTimeLock");

  const args: any[] = [
    // IVotes _token,
    daoToken.address,
    // TimelockController _timelock,
    daoTimeLock.address,
    // uint256 _votingDelay,
    networkValues.contractValues.DaoGovernor.votingDelay,
    // uint256 _votingPeriod,
    networkValues.contractValues.DaoGovernor.votingPeriod,
    // uint256 _quorumPercentage
    networkValues.contractValues.DaoGovernor.quorumPercentage,
  ];

  const governor = await deploy("DaoGovernor", {
    from: deployer,
    args,
    log: true,
    // gasLimit: 935298,
  });

  if (networkValues.verifyContracts) await verify(governor.address, args);
}

deploy.tags = ["all"];

export default deploy;
