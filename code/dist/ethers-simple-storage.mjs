// src/ethers-simple-storage.ts
import { config } from "dotenv";
import { ethers } from "ethers";
import fs from "node:fs/promises";
import { resolve } from "node:path";
config();
var SSPATH = resolve("src/SimpleStorage.sol");
async function deploy() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const abi = await fs.readFile("src/SimpleStorage_sol_SimpleStorage.abi", "utf-8");
  const bin = await fs.readFile("src/SimpleStorage_sol_SimpleStorage.bin", "utf-8");
  const contractFactory = new ethers.ContractFactory(abi, bin, wallet);
  console.log("Deploying...");
  const contract = await contractFactory.deploy();
  const address = await contract.getAddress();
  console.log("Deployed to:", address);
  await contract.waitForDeployment();
  const txl = await contract.store(Math.floor(Math.random() * 1e3).toString());
  console.log("Txl:", txl);
  const currentFav = await contract.retreive();
  return currentFav.toString();
}
deploy().then(console.log);
