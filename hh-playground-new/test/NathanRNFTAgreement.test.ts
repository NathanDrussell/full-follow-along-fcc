import { expect } from "chai";
import { deployments, ethers, getNamedAccounts } from "hardhat";
import { NathanRNFTAgreement, NathanRNFTAgreement__factory } from "../typechain-types";

describe("NathanRNFTAgreement", () => {
  let agreement: NathanRNFTAgreement;
  beforeEach(async () => {
    await deployments.fixture(["personal"]);
    agreement = await ethers.getContract<NathanRNFTAgreement>("NathanRNFTAgreement");
  });

  describe("constructor", () => {
    it("The deployer should be the nathansWallet", async () => {
      const { deployer } = await getNamedAccounts();
      const nathansWallet = await agreement.nathansWallet();

      expect(nathansWallet).to.equal(deployer);
    });
  });

  describe("Create Agreement", () => {
    it("Should create an agreement", async () => {
      const { deployer } = await getNamedAccounts();
      const tx = await agreement.create({
        value: ethers.parseEther("0.1"),
      });
      const abc = await tx.wait();

      const result = await agreement.getAgreement();
      expect(result).to.be.an("array");
      const [client, duration, balance, createdAt, state] = result;

      expect(client).to.equal(deployer);
      expect(duration).to.equal(BigInt(60 * 60 * 24 * 90));
      expect(balance).to.equal(ethers.parseEther("0.1"));
      expect(createdAt).to.equal((await abc!.getBlock()).timestamp);
      expect(state).to.equal(0n /* Active */);
    });

    it("Should revert if the value is less than 0.1 ETH", async () => {
      await expect(
        agreement.create({
          value: ethers.parseEther("0.09"),
        })
      ).to.be.revertedWithCustomError(agreement, "InvalidFee");
    });

    it("Should emit an event", async () => {
      await expect(
        agreement.create({
          value: ethers.parseEther("0.1"),
        })
      ).to.emit(agreement, "AgreementCreated");
    });
  });

  describe("Cancel Agreement", () => {
    let clientContract: NathanRNFTAgreement, clientWalletAddress: string;

    beforeEach(async () => {
      const { client } = await getNamedAccounts();
      clientWalletAddress = client;
      clientContract = await ethers.getContract<NathanRNFTAgreement>("NathanRNFTAgreement", client);
      const tx = await clientContract.create({
        value: ethers.parseEther("0.1"),
      });
      await tx.wait();
    });

    it("Should cancel the agreement", async () => {
      const tx = await clientContract.cancel();
      await tx.wait();
      const result = await clientContract.getAgreement();
      expect(result).to.be.an("array");

      const [clientAddress, , balance, , state] = result;
      expect(clientAddress).to.equal(clientWalletAddress);
      expect(balance).to.equal(0n);
      expect(state).to.equal(1n /* Cancelled */);
    });

    it("Should emit an event", async () => {
      await expect(clientContract.cancel()).to.emit(clientContract, "AgreementCancelled");
    });

    it("Should not be cancelled if the duration is over", async () => {
      await ethers.provider.send("evm_increaseTime", [60 * 60 * 24 * 90 + 1]);
      await ethers.provider.send("evm_mine", []);
      await expect(clientContract.cancel()).to.be.revertedWithCustomError(agreement, "AgreementCancelationPeriodOver");
    });

    it("Should not be cancelled if the agreement is already cancelled", async () => {
      await clientContract.cancel();
      await expect(clientContract.cancel()).to.be.revertedWithCustomError(agreement, "InvalidState");
    });

    it("Should not be cancelled if the agreement is already completed", async () => {
      await clientContract.release();
      await expect(clientContract.cancel()).to.be.revertedWithCustomError(clientContract, "InvalidState");
    });
  });
});
