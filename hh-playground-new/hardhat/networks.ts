import { HardhatConfig } from "hardhat/types";
import { z } from "zod";

const mainnet =
  process.env.USE_MAINNET !== "false"
    ? {
        mainnet: {
          url: process.env.MAINNET_RPC_URL,
          chainId: 1,
          accounts: [process.env.MAINNET_PRIVATE_KEY as string],
        },
      }
    : {};

export const networks = {
  ...mainnet,
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.SEPOLIA_PRIVATE_KEY as string],
    chainId: 11155111,
  },
  localhost: {
    url: "http://127.0.0.1:8545",
    chainId: 31337,
  },
  hardhat: {
    chainId: 31337,
    forking: {
      url: process.env.MAINNET_RPC_URL as string,
    },
  },
};

export type Networks = "hardhat" | keyof typeof networks | (string & {});
type NetworkValues = z.infer<typeof networkValuesValidator>;

const networkValuesValidator = z.object({
  verifyContracts: z.boolean().default(false),
  contracts: z.object({
    WrappedETH: z.string().startsWith("0x").or(z.null()),
    Dai: z.string().startsWith("0x").or(z.null()),
    PoolAddressesProvider: z.string().startsWith("0x").or(z.null()),
    AggregatorV3Interface: z.string().startsWith("0x").or(z.null()),
    AaveOracle: z.string().startsWith("0x").or(z.null()),
  }),
});

const networkValues: Record<Networks, NetworkValues> = {
  hardhat: {
    verifyContracts: false,
    contracts: {
      WrappedETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      Dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",

      PoolAddressesProvider: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
      AggregatorV3Interface: "0x773616E4d11A78F511299002da57A0a94577F1f4",
      AaveOracle: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
    },
  },
  localhost: {
    verifyContracts: false,
    contracts: {
      WrappedETH: null,
      Dai: null,
      PoolAddressesProvider: null,
      AggregatorV3Interface: null,
      AaveOracle: null,
    },
  },
  mainnet: {
    verifyContracts: false,
    contracts: {
      WrappedETH: null,
      Dai: null,
      PoolAddressesProvider: null,
      AggregatorV3Interface: null,
      AaveOracle: null,
    },
  },
  sepolia: {
    verifyContracts: true,
    contracts: {
      WrappedETH: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
      Dai: null,
      PoolAddressesProvider: null,
      AggregatorV3Interface: null,
      AaveOracle: null,
    },
  },
};

export function getNetworkValues(network: Networks) {
  if (!networkValues[network]) throw new Error(`Network ${network} not found`);
  return networkValuesValidator.parse(networkValues[network]);
}
