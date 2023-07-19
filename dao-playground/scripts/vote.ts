import { log } from "console";
import { EventLog } from "ethers";
import { ethers, network } from "hardhat";
import { getNetworkValues } from "../hardhat/networks";
import { Box, DaoGovernor } from "../typechain-types";
import { fastForward } from "../utils/ff";

const networkValues = getNetworkValues(network.name);

async function vote() {
  const proposalId =
    98347769141583702122000605390689571819603531868383388652197418417556996500238n;

  const governor = await ethers.getContract<DaoGovernor>("DaoGovernor");

  const voteState = await governor.state(proposalId);
  console.log("Proposal state:", voteState);

  const vote = await governor.castVoteWithReason(
    proposalId,
    1,
    "I vote yes because I want to"
  );
  await vote.wait();

  if (networkValues.local) {
    console.log("Pre clock:", await governor.clock());
    await fastForward(
      networkValues.contractValues.DaoGovernor.votingPeriod + 1n
    );
    console.log("Post clock:", await governor.clock());
    console.log("Vote deadline", await governor.proposalDeadline(proposalId));
  }

  console.log("Proposal state:", await governor.state(proposalId));

  log("done");
}

vote()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
