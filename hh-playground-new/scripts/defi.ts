import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, getNamedAccounts, network } from "hardhat";
import { readFile } from "node:fs/promises";
import { getNetworkValues } from "../hardhat/networks";

const networkValues = getNetworkValues(network.name);

export const getWethContract = async (signer: HardhatEthersSigner) => {
  const wethAbi = await readFile("./abis/weth.json", "utf-8").then(JSON.parse);
  return ethers.getContractAt(wethAbi as "ERC20", networkValues.contracts.WrappedETH!, signer);
};

export const getWeth = async (amount: bigint, signer: HardhatEthersSigner) => {
  const iWeth = await getWethContract(signer);

  // @ts-expect-error
  const tx = await iWeth.deposit({ value: amount });

  await tx.wait();
};

export const getPool = async (signer: HardhatEthersSigner) => {
  const poolAddressesProvider = await ethers.getContractAt("IPoolAddressesProvider", networkValues.contracts.PoolAddressesProvider!, signer);
  const poolAddress = await poolAddressesProvider.getPool();
  return ethers.getContractAt("IPool", poolAddress, signer);
};

export const userData = async (pool: any, signer: HardhatEthersSigner) => {
  const [totalCollateralBase, totalDebtBase, availableBorrowsBase, currentLiquidationThreshold, ltv, healthFactor] = await pool.getUserAccountData(
    await signer.getAddress()
  );

  console.log(`Total Collateral: ${ethers.formatUnits(totalCollateralBase, 8)}`);
  console.log(`Total Debt: ${ethers.formatUnits(totalDebtBase, 8)}`);
  console.log(`Available Borrows: ${ethers.formatUnits(availableBorrowsBase, 8)}`);

  return {
    totalCollateralBase,
    totalDebtBase,
    availableBorrowsBase,
  };
};

export const getDAIPrice = async () => {
  const daiEthPriceFeed = await ethers.getContractAt("AggregatorV3Interface", networkValues.contracts.AggregatorV3Interface!);

  const [, price] = await daiEthPriceFeed.latestRoundData();

  console.log(`DAI Price: ${ethers.formatEther(price)}`);

  return price;
};

export const borrow = async () => {
  const { deployer } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);

  const pool = await getPool(signer);
  const weth = await getWethContract(signer);
  const dai = await ethers.getContractAt("ERC20", networkValues.contracts.Dai!, signer);
  const oracle = await ethers.getContractAt("IAaveOracle", networkValues.contracts.AaveOracle!, signer);
  // const price = await oracle.getAssetPrice(networkValues.contracts.WrappedETH!);

  await getWeth(ethers.parseEther("0.2"), signer);

  const wethApproveTx = await weth.approve(await pool.getAddress(), ethers.parseEther("0.2"));
  await wethApproveTx.wait();

  const userData0 = await userData(pool, signer);
  console.log("-----------------------------");

  console.log("Depositing 0.2 WETH");
  const depositTx = await pool.supply(await weth.getAddress(), ethers.parseEther("0.2"), signer, 0);
  await depositTx.wait();
  console.log("Deposited 0.2 WETH");

  console.log("-----------------------------");
  const userData1 = await userData(pool, signer);
  const daiPrice = await oracle.getAssetPrice(networkValues.contracts.Dai!);
  const amountInDai = (userData1.availableBorrowsBase / daiPrice - 10n).toString();
  console.log("daiPrice", ethers.formatUnits(daiPrice, 8));
  const daiBorrow = await ethers.parseEther(amountInDai);
  console.log("amountInDai", daiBorrow);
  const borrowTx = await pool.borrow(networkValues.contracts.Dai!, daiBorrow, 2, 0, signer);
  await borrowTx.wait();
  console.log("-----------------------------");
  await userData(pool, signer);
  console.log(`Borrowing ${ethers.formatUnits(daiBorrow, 8)} DAI`);
  const daiApproveTx = await dai.approve(await pool.getAddress(), daiBorrow);
  await daiApproveTx.wait();
  await pool.repay(networkValues.contracts.Dai!, daiBorrow, 2, signer);
  await userData(pool, signer);
};

borrow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
