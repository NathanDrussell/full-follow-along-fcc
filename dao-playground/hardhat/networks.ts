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
};

export type Networks = "hardhat" | keyof typeof networks | (string & {});
type NetworkValues = z.infer<typeof networkValuesValidator>;

// IVotes _token,
// TimelockController _timelock,
// uint256 _votingDelay,
// uint256 _votingPeriod,
// uint256 _quorumPercentage
const networkValuesValidator = z.object({
  verifyContracts: z.boolean().default(false),
  local: z.boolean().default(false),

  contractValues: z.object({
    DaoTimeLock: z.object({
      minDelay: z.bigint(),
    }),
    DaoGovernor: z.object({
      votingDelay: z.bigint(),
      votingPeriod: z.bigint(),
      quorumPercentage: z.bigint().min(0n).max(100n),
    }),
  }),
});
// 21600 /* 3 day */, 50400 /* 1 week */, 0

const networkValues: Record<Networks, NetworkValues> = {
  hardhat: {
    verifyContracts: false,
    local: true,
    contractValues: {
      DaoTimeLock: {
        minDelay: 3600n,
      },
      DaoGovernor: {
        votingDelay: 300n,
        votingPeriod: 1200n,
        quorumPercentage: 4n,
      },
    },
  },
  localhost: {
    verifyContracts: false,
    local: true,
    contractValues: {
      DaoTimeLock: {
        minDelay: 3600n,
      },
      DaoGovernor: {
        votingDelay: 300n,
        votingPeriod: 1200n,
        quorumPercentage: 4n,
      },
    },
  },
  mainnet: {
    verifyContracts: false,
    local: false,
    contractValues: {
      DaoTimeLock: {
        minDelay: 3600n,
      },
      DaoGovernor: {
        votingDelay: 300n,
        votingPeriod: 50400n,
        quorumPercentage: 4n,
      },
    },
  },
  sepolia: {
    verifyContracts: true,
    local: false,
    contractValues: {
      DaoTimeLock: {
        minDelay: 3600n,
      },
      DaoGovernor: {
        votingDelay: 300n,
        votingPeriod: 50400n,
        quorumPercentage: 4n,
      },
    },
  },
};

export function getNetworkValues(network: Networks) {
  if (!networkValues[network]) throw new Error(`Network ${network} not found`);
  return networkValuesValidator.parse(networkValues[network]);
}
