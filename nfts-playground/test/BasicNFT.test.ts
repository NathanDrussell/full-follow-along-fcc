import { expect } from "chai";
import { deployments, ethers, getNamedAccounts } from "hardhat";
import { BasicNFT } from "../typechain-types";

describe("Simple", () => {
  let basicNft: BasicNFT;
  beforeEach(async () => {
    const { deployer } = await getNamedAccounts();
    await deployments.fixture(["all"]);
    basicNft = await ethers.getContract<BasicNFT>("BasicNFT", deployer);
  });

  it("Name is correct", async () => {
    const name = await basicNft.name();
    expect(name).to.equal("Unbounded");
  });

  it("Symbol is correct", async () => {
    const symbol = await basicNft.symbol();
    expect(symbol).to.equal("UNBND");
  });

  it("Token URI is an IPFS url", async () => {
    const tokenURI = await basicNft.tokenURI(0);
    expect(tokenURI).to.match(/^ipfs:\/\/.*/);
  });

  it("Mint increases total minted count", async () => {
    const signers = await ethers.getSigners();
    const offset = 1;
    const totalSupplyBefore = await basicNft.getMinted();
    for (let i = 0; i < signers.length - offset; i++) {
      await basicNft.connect(signers[i]).mintUnbounded();
    }
    const totalSupplyAfter = await basicNft.getMinted();
    expect(totalSupplyAfter).to.equal(+totalSupplyBefore.toString() + signers.length - offset);
  });
});
