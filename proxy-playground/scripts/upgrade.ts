import { deployments, ethers } from "hardhat";
import { BoxProxyAdmin } from "../typechain-types";

async function main() {
  await deployments.fixture(["all"]);

  const boxProxyAdmin = await ethers.getContract<BoxProxyAdmin>(
    "BoxProxyAdmin"
  );
  const transparentProxy = await ethers.getContract("Box_Proxy");
  const boxV2 = await ethers.getContract("BoxV2");

  const proxiedBoxV1 = await ethers.getContractAt(
    "BoxV2",
    await transparentProxy.getAddress()
  );
  console.log(
    "Preupgrade Box value:",
    (await proxiedBoxV1.version()).toString()
  );

  const upgradeTx = await boxProxyAdmin.upgrade(
    await transparentProxy.getAddress(),
    await boxV2.getAddress()
  );

  await upgradeTx.wait();

  const proxiedBox = await ethers.getContractAt(
    "BoxV2",
    await transparentProxy.getAddress()
  );

  console.log("Box value:", (await proxiedBox.version()).toString());
}

main();
