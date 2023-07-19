import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentNetworks } from "../hardhat.config";
import { networkConfigs } from "../helper-hardhat.config";

async function deploy({ network, getNamedAccounts, deployments }: HardhatRuntimeEnvironment) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const networkConfig = networkConfigs[network.name as keyof typeof networkConfigs];

  if (!developmentNetworks.includes(network.name)) {
    log(`skipping deployment to ${network.name} network`);
    return;
  }

  log(`deploying to ${network.name} network`);

  await deploy("VRFCoordinatorV2Mock", {
    from: deployer,
    args: [ethers.parseEther("0.1"), 1e9],
    log: true,
  });

  log(`deployed VRFCoordinatorV2Mock to ${network.name} network`);
}

deploy.tags = ["all", "mocks"];

export default deploy;
