import { ethers } from "hardhat";
import { Marketplace } from "../typechain-types";

const dumpLogs = async () => {
  //   const mp = await ethers.getContract<Marketplace>("Marketplace");

  const contract = await ethers.getContractAt(
    // "ERC721",
    "ERC1155",
    // "0x22f9728672a2093B73046C1AF26eA289381Df2cd"
    "0x38a6fd7148c4900338e903258B5E289Dfa995E2E"
  );

  console.time("queryFilter");
  const result = await contract.queryFilter("TransferSingle");
  console.timeEnd("queryFilter");
  //   console.table(result);
  console.log(result.length);
};

dumpLogs().then(() => process.exit(0));
