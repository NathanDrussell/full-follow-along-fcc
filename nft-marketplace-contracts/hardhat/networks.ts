import { HardhatConfig } from "hardhat/types";
import { z } from "zod";

const mainnet =
  process.env.USE_MAINNET === "true"
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
      url: process.env.MAINNET_RPC_URL,
    },
  },
};

export type Networks = "hardhat" | keyof typeof networks | (string & {});
type NetworkValues = z.infer<typeof networkValuesValidator>;

const networkValuesValidator = z.object({
  verifyContracts: z.boolean().default(false),
});

const networkValues: Record<Networks, NetworkValues> = {
  hardhat: {
    verifyContracts: false,
  },
  localhost: {
    verifyContracts: false,
  },
  mainnet: {
    verifyContracts: false,
  },
  sepolia: {
    verifyContracts: true,
  },
};

export function getNetworkValues(network: Networks) {
  if (!networkValues[network]) throw new Error(`Network ${network} not found`);
  return networkValuesValidator.parse(networkValues[network]);
}
