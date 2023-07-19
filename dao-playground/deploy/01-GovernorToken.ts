import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { Networks, getNetworkValues } from "../hardhat/networks";
import { DaoToken } from "../typechain-types";
import { verify } from "../utils/verify";

const networkValues = getNetworkValues(network.name);

async function deploy() {
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  const args: any[] = [];

  const daoToken = await deploy("DaoToken", {
    from: deployer,
    args,
    log: true,
  });

  if (networkValues.verifyContracts) await verify(daoToken.address, args);

  await delegate(daoToken.address, deployer);
}

async function delegate(address: string, delegatee: string) {
  const dt = await ethers.getContractAt("DaoToken", address);

  const tx = await dt.delegate(delegatee);
  await tx.wait(1);

  const checkpoints = await dt.numCheckpoints(delegatee);

  console.log(
    `Delegated ${address} to ${delegatee}, ${checkpoints} checkpoints`
  );
}

deploy.tags = ["all"];

export default deploy;
