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

const ethAddressValidator = z.string().startsWith("0x").length(42).nullable();

const networkValuesValidator = z.object({
  staging: z.boolean().default(false),
  confirmations: z.number().default(1),
  verifyContracts: z.boolean().default(false),
  deployMocks: z.boolean().default(false),
  contracts: z.object({
    vrfCoordinatorV2: ethAddressValidator,
  }),
  contractValues: z.object({
    RandomizedNFT: z.object({
      chainlinkSubsctiptionId: z.string().nullable(),
      callbackGasLimit: z.number().nullable(),
      gasLane: z.string().nullable(),
      mintPrice: z.string().nullable(),
    }),
  }),
});

const networkValues: Record<Networks, NetworkValues> = {
  hardhat: {
    staging: false,
    confirmations: 1,
    verifyContracts: false,
    deployMocks: true,
    contracts: {
      vrfCoordinatorV2: null,
    },
    contractValues: {
      RandomizedNFT: {
        callbackGasLimit: 500000,
        chainlinkSubsctiptionId: null,
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        mintPrice: "0.001",
      },
    },
  },
  localhost: {
    staging: false,
    confirmations: 1,
    verifyContracts: false,
    deployMocks: true,
    contracts: {
      vrfCoordinatorV2: null,
    },
    contractValues: {
      RandomizedNFT: {
        callbackGasLimit: 500000,
        chainlinkSubsctiptionId: null,
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        mintPrice: "0.001",
      },
    },
  },
  mainnet: {
    staging: true,
    confirmations: 3,
    verifyContracts: false,
    deployMocks: false,
    contracts: {
      vrfCoordinatorV2: null,
    },
    contractValues: {
      RandomizedNFT: {
        callbackGasLimit: null,
        chainlinkSubsctiptionId: null,
        gasLane: null,
        mintPrice: "0.001",
      },
    },
  },
  sepolia: {
    staging: true,
    confirmations: 3,
    verifyContracts: true,
    deployMocks: false,
    contracts: {
      vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
    },
    contractValues: {
      RandomizedNFT: {
        callbackGasLimit: 500000,
        chainlinkSubsctiptionId: "3741",
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        mintPrice: "0.001",
      },
    },
  },
};

export function getNetworkValues(network: Networks) {
  if (!networkValues[network]) throw new Error(`Network ${network} not found`);
  return networkValuesValidator.parse(networkValues[network]);
}
