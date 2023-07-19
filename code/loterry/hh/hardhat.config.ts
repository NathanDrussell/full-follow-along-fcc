import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import { config as dotenv } from "dotenv";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "hardhat-gas-reporter";
import { HardhatUserConfig } from "hardhat/config";
import "solidity-coverage";
import { z } from "zod";
dotenv();

const validateEnv = z
  .object({
    ETHERSCAN_API_KEY: z.string(),
    COINMARKETCAP_API_KEY: z.string(),
    SEPOLIA_RPC_URL: z.string().url(),
    SEPOLIA_PRIVATE_KEY: z.string().length(64),
    MAINNET_RPC_URL: z.string().url().or(z.literal("")),
    MAINNET_PRIVATE_KEY: z.string().length(64).or(z.literal("")),
  })
  .safeParse(process.env);

const config: HardhatUserConfig = {
  // solidity: "0.8.18",
  solidity: {
    compilers: [{ version: "0.8.18" }, { version: "0.6.0" }],
  },
  mocha: {
    timeout: 300000,
  },
  // defaultNetwork: 'localhost',
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  networks: Object.assign(
    process.env.MAINNET_RPC_URL
      ? {
          mainet: {
            url: process.env.MAINNET_RPC_URL,
            chainId: 1,
            accounts: [process.env.MAINNET_PRIVATE_KEY as string],
          },
        }
      : {},
    {
      sepolia: {
        url: process.env.SEPOLIA_RPC_URL,
        chainId: 11155111,
        blockConfirmations: 3,
        accounts: [process.env.SEPOLIA_PRIVATE_KEY as string],
      },
      localhost: {
        url: "http://127.0.0.1:8545",
        blockConfirmations: 1,
        chainId: 31337,
      },
    },
  ),
  gasReporter: {
    enabled: false,
    outputFile: "gas-report.txt",
    currency: "CAD",
    noColors: true,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export const developmentNetworks = ["localhost", "hardhat"];

export default config;
