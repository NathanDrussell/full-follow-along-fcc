import { ethers, network } from "hardhat";
import fs from "node:fs/promises";

async function generate() {
    const raffle = await ethers.getContract('Raffle');
    const address = await raffle.getAddress();
    const abi = raffle.interface.format(true);

    const contracts = {
        network: {
            name: network.name,
            chainId: network.config.chainId
        },
        Raffle: { address, abi }
    }

    const filename = `contracts.${network.name.toLowerCase()}.json`

    await fs.writeFile(filename, JSON.stringify(contracts, null, 2));
}

generate.tags = ["all"];
export default generate;