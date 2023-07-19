import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import { config as dotenv } from "dotenv";
import "hardhat-gas-reporter";
import { HardhatUserConfig } from "hardhat/config";
import "solidity-coverage";
import "./tasks/block-number";
dotenv();

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: "0.8.18",
  networks: {
    sepolia: {
      url: process.env.RPC_URL,
      chainId: +process.env.CHAIN_ID!,
      accounts: [process.env.PRIVATE_KEY!],
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: false,
    outputFile: "gas-report.txt",
    currency: "USD",
    noColors: true,
    coinmarketcap: "5488fcf4-a5ea-4248-aafd-abeb9338c292",
  },
};

export default config;
