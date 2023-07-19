import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { Networks, getNetworkValues } from "../hardhat/networks";
import { verify } from "../utils/verify";

const networkValues = getNetworkValues(network.name);

async function deploy() {
  if (!networkValues.deployMocks) return console.log("Mocks not deployed");

  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  const args: any[] = [ethers.parseEther("0.25"), 1e9];

  await deploy("VRFCoordinatorV2Mock", {
    from: deployer,
    args,
    log: true,
  });
}

deploy.tags = ["all", "mocks"];

export default deploy;
