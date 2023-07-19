import { ethers, network } from "hardhat";
import fs from "node:fs/promises";

async function generate() {
  const marketplace = await ethers.getContract("Marketplace");
  const address = await marketplace.getAddress();
  const abi = marketplace.interface.format(true);

  const contracts = {
    network: {
      name: network.name,
      chainId: network.config.chainId,
    },
    Marketplace: { address, abi },
  };

  const filename = `contracts.${network.name.toLowerCase()}.json`;

  await fs.writeFile(filename, JSON.stringify(contracts, null, 2));
}

generate.tags = ["all"];
export default generate;
