import { deployments, getNamedAccounts, network } from "hardhat";
import { Networks, getNetworkValues } from "../hardhat/networks";
import { verify } from "../utils/verify";

const networkValues = getNetworkValues(network.name);

async function deploy() {
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  const args: any[] = [];

  const simple = await deploy("SimpleNFT", {
    from: deployer,
    args,
    log: true,
  });

  if (networkValues.verifyContracts) await verify(simple.address, args);
}

deploy.tags = ["all", "tests", "persistent"];

export default deploy;
