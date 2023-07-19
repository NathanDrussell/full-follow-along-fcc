// Local plugins
import "./hardhat/env";
import { networks } from "./hardhat/networks";

// Official plugins
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import { HardhatUserConfig } from "hardhat/config";

// Community plugins
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.18",
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
    ],
  },
  networks,
  namedAccounts: {
    deployer: { default: 0 },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
