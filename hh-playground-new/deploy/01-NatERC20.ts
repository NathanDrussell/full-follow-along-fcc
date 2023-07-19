import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { Networks, getNetworkValues } from "../hardhat/networks";
import { verify } from "../utils/verify";

const networkValues = getNetworkValues(network.name);

async function deploy() {
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  const args: any[] = [ethers.parseEther("1000000")];

  const simple = await deploy("NatERC20", {
    from: deployer,
    args,
    log: true,
  });

  if (networkValues.verifyContracts) await verify(simple.address, args, "contracts/NatERC20.sol:NatERC20");
}

deploy.tags = ["all"];

export default deploy;
