import { expect } from "chai";
import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { getNetworkValues } from "../hardhat/networks";
import { BasicNFT, RandomizedNFT, VRFCoordinatorV2Interface, VRFCoordinatorV2Mock } from "../typechain-types";

// error InvalidBreed(uint256 rng);
// error NotEnoughEth();
// event NftRequested(uint256 indexed requestId, address indexed requester);
// event NftMinted(Breed indexed breed, address indexed owner);
const networkValues = getNetworkValues(network.name);

describe("RandomizedNFT", () => {
  let randomizedNft: RandomizedNFT, coordinator: VRFCoordinatorV2Mock, mintPrice: bigint;
  beforeEach(async () => {
    const { deployer } = await getNamedAccounts();
    await deployments.fixture(["all"]);
    randomizedNft = await ethers.getContract<RandomizedNFT>("RandomizedNFT", deployer);
    mintPrice = await randomizedNft.getMintFee();
    coordinator = await ethers.getContract<VRFCoordinatorV2Mock>("VRFCoordinatorV2Mock", deployer);
  });

  it("Requesting an NFT emits an event", async () => {
    await expect(
      randomizedNft.requestNft({
        value: mintPrice,
      })
    ).to.emit(randomizedNft, "NftRequested");
  });

  it("Should emit a Minted event", async () => {
    await new Promise<void>(async (resolve, reject) => {
      randomizedNft.on("NftMinted", (breed, address, event) => {
        try {
          expect(breed).to.be.a("bigint");
          expect(address).to.be.a("string");
          resolve();
        } catch (e) {
          console.log(e);
          reject(e);
        }
      });

      await randomizedNft.requestNft({ value: mintPrice });
      await coordinator.fulfillRandomWords(1, await randomizedNft.getAddress());
    });
  });
});
