import { ethers } from "hardhat";

export const networkConfigs = {
  sepolia: {
    chainId: 11155111,
    name: "sepolia",
    verify: true,
    blockConfirmations: 3,
    contracts: {
      vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
    },
    contractValues: {
      Raffle: {
        entranceFee: ethers.parseEther("0.001"),
        vrfGasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        chainlinkSubsctiptionId: "3639",
        callbackGasLimit: 500000,
        interval: 30,
      },
    },
  },
  hardhat: {
    chainId: 31337,
    name: "hardhat",
    testnet: false,
    blockConfirmations: 1,
    contracts: {
      vrfCoordinatorV2: false,
    },
    contractValues: {
      Raffle: {
        entranceFee: ethers.parseEther("0.001"),
        vrfGasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        chainlinkSubsctiptionId: null,
        callbackGasLimit: 500000,
        interval: 30,
      },
    },
  },
  localhost: {
    chainId: 31337,
    name: "localhost",
    testnet: false,
    blockConfirmations: 1,
    contracts: {
      vrfCoordinatorV2: false,
    },
    contractValues: {
      Raffle: {
        entranceFee: ethers.parseEther("0.001"),
        vrfGasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        callbackGasLimit: 500000,
        chainlinkSubsctiptionId: null,
        interval: 30,
      },
    },
  },
};

export const idByName = {
  sepolia: 11155111,
  hardhat: 31337,
};

export const developmentNetworks = ["localhost", "hardhat"];

export const testDefaultTimeout = 200 * 1000;
