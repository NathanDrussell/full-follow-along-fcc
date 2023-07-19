import { deployments, getNamedAccounts, network } from "hardhat";
import { Networks, getNetworkValues } from "../hardhat/networks";
import { verify } from "../utils/verify";

const networkValues = getNetworkValues(network.name);

async function deploy() {
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  const args: any[] = [];

  const simple = await deploy("BoxV2", {
    from: deployer,
    args,
    log: true,
    // proxy: {
    //   proxyContract: "OpenZeppelinTransparentProxy",
    //   viaAdminContract: {
    //     name: "BoxProxyAdmin",
    //     artifact: "BoxProxyAdmin",
    //   },
    // },
  });

  if (networkValues.verifyContracts) await verify(simple.address, args);
}

deploy.tags = ["all"];

export default deploy;
