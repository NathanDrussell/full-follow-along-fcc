import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { Networks, getNetworkValues } from "../hardhat/networks";
import { DaoGovernor, DaoTimeLock, DaoToken } from "../typechain-types";
import { verify } from "../utils/verify";

const networkValues = getNetworkValues(network.name);

async function deploy() {
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  const daoTimeLock = await ethers.getContract<DaoTimeLock>(
    "DaoTimeLock",
    deployer
  );
  const daoGovernor = await ethers.getContract<DaoGovernor>(
    "DaoGovernor",
    deployer
  );

  const args: any[] = [];

  const proposerRole = await daoTimeLock.PROPOSER_ROLE();
  const executorRole = await daoTimeLock.EXECUTOR_ROLE();
  const adminRole = await daoTimeLock.TIMELOCK_ADMIN_ROLE();

  const tx = await daoTimeLock.grantRole(
    proposerRole,
    await daoGovernor.getAddress()
  );
  await tx.wait(1);

  const executorTx = await daoTimeLock.grantRole(
    executorRole,
    ethers.ZeroAddress
  );
  await executorTx.wait(1);

  const revokeTx = await daoTimeLock.revokeRole(adminRole, deployer);
  await revokeTx.wait(1);

  // const governor = await deploy("DaoGovernor", {
  //   from: deployer,
  //   args,
  //   log: true,
  //   // gasLimit: 935298,
  // });

  // if (networkValues.verifyContracts) await verify(governor.address, args);
}

deploy.tags = ["all"];

export default deploy;
