import { time } from "@nomicfoundation/hardhat-network-helpers";
import { EventLog } from "ethers";
import { ethers, network } from "hardhat";
import { getNetworkValues } from "../hardhat/networks";
import { Box, DaoGovernor } from "../typechain-types";
import { fastForward } from "../utils/ff";

const networkValues = getNetworkValues(network.name);

async function queueAndExecute() {
  const governor = await ethers.getContract<DaoGovernor>("DaoGovernor");
  const box = await ethers.getContract<Box>("Box");
  const store42 = await box.interface.encodeFunctionData("store", [42]);
  const boxAddress = await box.getAddress();
  const descriptionHash = await ethers.keccak256(
    ethers.toUtf8Bytes("Store 42 in Box...")
  );

  console.log(await box.retrieve());

  const tx = await governor.queue(
    [boxAddress],
    [0],
    [store42],
    descriptionHash
  );
  await tx.wait();
  console.log("queued");
  await time.increase(networkValues.contractValues.DaoTimeLock.minDelay);

  const tx2 = await governor.execute(
    [boxAddress],
    [0],
    [store42],
    descriptionHash
  );
  await tx2.wait();
  console.log(await box.retrieve());
}

queueAndExecute()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
