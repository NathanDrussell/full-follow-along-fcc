import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { Networks, getNetworkValues } from "../hardhat/networks";
import { VRFCoordinatorV2Interface, VRFCoordinatorV2Mock } from "../typechain-types";
import { verify } from "../utils/verify";

const networkValues = getNetworkValues(network.name);

async function deploy() {
  const { deployer } = await getNamedAccounts();
  const { deploy, log } = deployments;

  let vrfCoordinatorV2: VRFCoordinatorV2Mock | VRFCoordinatorV2Interface = null!,
    vrfCoordinatorV2Address = networkValues.contracts.vrfCoordinatorV2,
    subscriptionId = networkValues.contractValues.RandomizedNFT.chainlinkSubsctiptionId;

  if (networkValues.deployMocks) {
    vrfCoordinatorV2 = await ethers.getContract<VRFCoordinatorV2Mock>("VRFCoordinatorV2Mock");
    vrfCoordinatorV2Address = await vrfCoordinatorV2.getAddress();
    const transactionResponse = await vrfCoordinatorV2.createSubscription();
    const txReceipt = await transactionResponse.wait(networkValues.confirmations);
    subscriptionId = txReceipt?.logs?.[0]?.topics?.[1]!;
    log(`SubscriptionId: ${subscriptionId}`);
    await vrfCoordinatorV2.fundSubscription(subscriptionId!, ethers.parseEther("50"));
  } else {
    vrfCoordinatorV2 = await ethers.getContractAt("VRFCoordinatorV2Interface", vrfCoordinatorV2Address!);
  }

  const args: any[] = [
    // address vrfCoordinatorV2Address,
    vrfCoordinatorV2Address,
    // uint64 subscriptionId,
    subscriptionId,
    // bytes32 gasLane,
    networkValues.contractValues.RandomizedNFT.gasLane,
    // uint32 callbackGasLimit,
    networkValues.contractValues.RandomizedNFT.callbackGasLimit,
    // uint256 mintPrice
    await ethers.parseEther(networkValues.contractValues.RandomizedNFT.mintPrice!),
  ];

  const simple = await deploy("RandomizedNFT", {
    from: deployer,
    args,
    log: true,
  });

  if (networkValues.verifyContracts) await verify(simple.address, args);

  if (vrfCoordinatorV2) {
    const tx = await vrfCoordinatorV2.addConsumer(subscriptionId!, simple.address);
    await tx.wait();
    log(`Added ${simple.address} as a consumer of ${vrfCoordinatorV2Address}`);
  }
}

deploy.tags = ["all"];

export default deploy;
