import "./hardhat/env";
import { networks } from "./hardhat/networks";

import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import { HardhatUserConfig, task } from "hardhat/config";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks,
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
