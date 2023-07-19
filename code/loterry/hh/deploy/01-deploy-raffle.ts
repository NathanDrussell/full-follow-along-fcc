import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentNetworks } from "../hardhat.config";
import { networkConfigs } from "../helper-hardhat.config";
import { VRFCoordinatorV2Mock } from "../typechain-types";
import { verify } from "../utils/verify";

async function deploy({ network, getNamedAccounts, deployments }: HardhatRuntimeEnvironment) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const netowrkConfig = networkConfigs[network.name as keyof typeof networkConfigs];
  let vrfCoordinatorV2!: VRFCoordinatorV2Mock;

  let vrfCoordinatorV2Address = netowrkConfig.contracts.vrfCoordinatorV2,
    subscriptionId = netowrkConfig.contractValues.Raffle.chainlinkSubsctiptionId;

  if (developmentNetworks.includes(network.name)) {
    vrfCoordinatorV2 = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinatorV2Address = await vrfCoordinatorV2.getAddress();
    const transactionResponse = await vrfCoordinatorV2.createSubscription();
    const txReceipt = await transactionResponse.wait();
    subscriptionId = txReceipt?.logs?.[0]?.topics?.[1]!;
    log(`SubscriptionId: ${subscriptionId}`);
    await vrfCoordinatorV2.fundSubscription(subscriptionId!, ethers.parseEther("50"));
  } else {
    // must get the contract for the network w/ address
  }

  const args = [
    // address vrfCoordinator,
    vrfCoordinatorV2Address,
    // uint256 entranceFee,
    netowrkConfig.contractValues.Raffle.entranceFee,
    // bytes32 gasLane,
    netowrkConfig.contractValues.Raffle.vrfGasLane,
    // uint64 subscriptionId,
    subscriptionId,
    // uint32 callbackGasLimit,
    netowrkConfig.contractValues.Raffle.callbackGasLimit,
    // uint256 interval
    netowrkConfig.contractValues.Raffle.interval,
  ];

  const raffle = await deploy("Raffle", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: netowrkConfig.blockConfirmations,
  });

  if (!developmentNetworks.includes(network.name)) {
    log(`verifying contract on ${network.name} network address ${raffle.address}`);
    await verify(raffle.address, args);
  }

  if (vrfCoordinatorV2) await vrfCoordinatorV2.addConsumer(subscriptionId!, raffle.address);
}

deploy.tags = ["all"];

export default deploy;
