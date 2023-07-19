import { EventLog } from "ethers";
import { ethers, network } from "hardhat";
import { getNetworkValues } from "../hardhat/networks";
import { Box, DaoGovernor } from "../typechain-types";
import { fastForward } from "../utils/ff";

const networkValues = getNetworkValues(network.name);

async function propose() {
  const governor = await ethers.getContract<DaoGovernor>("DaoGovernor");
  const box = await ethers.getContract<Box>("Box");
  const store42 = await box.interface.encodeFunctionData("store", [42]);
  const boxAddress = await box.getAddress();
  console.log(`Proposing to store 42 in ${boxAddress}`);
  console.log(`Encoded data: ${store42}`);

  const tx = await governor.propose(
    [boxAddress],
    [0],
    [store42],
    "Store 42 in Box..."
  );
  const receipt = await tx.wait();

  // uint256 snapshot = proposalSnapshot(proposalId);
  // uint256 currentTimepoint = clock();

  console.log(`Current clock:`, await governor.clock());

  const proposalCreated: EventLog = receipt?.logs.find(
    (log: any) => log.eventName === "ProposalCreated"
  ) as any;

  const proposalId = proposalCreated.args?.proposalId;

  console.log(`Proposal Clock:`, await governor.proposalSnapshot(proposalId));

  if (networkValues.local)
    await fastForward(networkValues.contractValues.DaoGovernor.votingDelay);

  console.log(`Current clock:`, await governor.clock());

  console.log(proposalId);
}

propose()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
