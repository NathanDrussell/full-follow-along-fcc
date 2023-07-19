import { mine, time } from "@nomicfoundation/hardhat-network-helpers";
import { network } from "hardhat";

export const fastForward = async (blocks: number | bigint) => {
  for (let i = 0; i < blocks; i++) await mine();
};
