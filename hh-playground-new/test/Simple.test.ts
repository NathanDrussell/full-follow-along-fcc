import { expect } from "chai";
import { deployments, ethers, getNamedAccounts } from "hardhat";
import { Simple } from "../typechain-types";

describe("Simple", () => {
  it("Constructor", async () => {
    const { deployer } = await getNamedAccounts();
    await deployments.fixture(["all"]);
    const contract = (await ethers.getContract("Simple", deployer)) as Simple;

    const owner = await contract.ownerAddress();

    expect(owner).to.equal(deployer);
  });
});
