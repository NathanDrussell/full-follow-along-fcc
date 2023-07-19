import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { BaseContract } from "ethers";
import { deployments, ethers, getNamedAccounts } from "hardhat";
import { Marketplace, SimpleNFT } from "../typechain-types";
// event ItemListed(
//   address indexed seller,
//   address indexed nftAddress,
//   uint256 indexed tokenId,
//   uint256 price
// );

// event ItemBought(
//   address indexed buyer,
//   address indexed nftAddress,
//   uint256 indexed tokenId,
//   uint256 price
// );

// error MustSpecifyPrice();
// error MustBeApproved();
// error MustBeOwner();
// error AlreadyListed();
// error NotForSale();
// error NotEnoughEther();
// error TransferFailed();

const listen = (
  contract: BaseContract,
  eventName: string,
  {
    onEvent,
    trigger,
  }: {
    onEvent: Function;
    trigger: Function;
  }
) =>
  new Promise<void>(async (resolve, reject) => {
    contract.once(eventName, async (...args) => {
      try {
        await onEvent(...args);
        resolve();
      } catch (e) {
        console.error(`Failed to handle event ${eventName}: ${e}`);
      }
    });
    try {
      await trigger();
    } catch (e) {
      console.error(`Failed to trigger event ${eventName}: ${e}`);
      reject(e);
    }
  });
describe("Marketplace", () => {
  let marketplace: Marketplace;
  let nft: SimpleNFT;
  let signers = [] as HardhatEthersSigner[];
  let assetAddress = "";

  beforeEach(async () => {
    await deployments.fixture(["all"]);
    const { deployer } = await getNamedAccounts();
    marketplace = await ethers.getContract<Marketplace>(
      "Marketplace",
      deployer
    );

    const offset = 1;
    signers = (await ethers.getSigners()).slice(offset);
    nft = await ethers.getContract<SimpleNFT>("SimpleNFT");
    const txs = [] as Promise<unknown>[];
    for (const signer of signers) {
      const tx = await nft.connect(signer).mint();
      txs.push(tx.wait());
    }

    await Promise.all(txs);

    assetAddress = await nft.getAddress();
  });

  describe("Getting a listing", async () => {
    it("Can get a listing", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const listing = await marketplace.getListing(assetAddress, tokenId);
      expect(listing.seller).to.equal(ethers.ZeroAddress);
      expect(listing.price).to.equal(0n);
    });
  });

  describe("Listing an item", async () => {
    it("Can list an item", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);
      await approveTx.wait();
      const tx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await tx.wait();

      const listing = await marketplace.getListing(assetAddress, tokenId);

      expect(listing.seller).to.equal(signers[0].address);
      expect(listing.price).to.equal(ethers.parseEther("1"));
    });

    it("Cannot list an item that is not approved", async () => {
      const tokenId = 1;
      const signer = signers[tokenId];
      await expect(
        marketplace
          .connect(signer)
          .listAsset(assetAddress, tokenId, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(marketplace, "MustBeApproved");
    });

    it("Cannot list an item that is already listed", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);

      await approveTx.wait();
      const tx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await tx.wait();

      await expect(
        marketplace
          .connect(signer)
          .listAsset(assetAddress, tokenId, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(marketplace, "AlreadyListed");
    });

    it("Cannot list an item with a price of 0", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);

      await approveTx.wait();
      await expect(
        marketplace.connect(signer).listAsset(assetAddress, tokenId, 0n)
      ).to.be.revertedWithCustomError(marketplace, "MustSpecifyPrice");
    });

    it("Cannot list an item that is not owned", async () => {
      const tokenId = 1;
      const signer = signers[tokenId];
      const otherSigner = signers[0];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);

      await approveTx.wait();
      await expect(
        marketplace
          .connect(otherSigner)
          .listAsset(assetAddress, tokenId, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(marketplace, "MustBeOwner");
    });

    it("Cannot list an item that is not an NFT", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);

      await approveTx.wait();
      await expect(
        marketplace
          .connect(signer)
          .listAsset(signer.address, tokenId, ethers.parseEther("1"))
      ).to.be.reverted;
    });

    it('Emits an "ItemListed" event', async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);
      await approveTx.wait();

      await listen(marketplace, "ItemListed", {
        onEvent: async (
          seller: string,
          nftAddress: string,
          tokenId: bigint,
          price: bigint
        ) => {
          expect(seller).to.equal(signer.address);
          expect(nftAddress).to.equal(assetAddress);
          expect(tokenId).to.equal(tokenId);
          expect(price).to.equal(ethers.parseEther("1"));
        },
        trigger: async () => {
          const tx = await marketplace
            .connect(signer)
            .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
          await tx.wait();
        },
      });
    });
  });

  describe("Buying an item", async () => {
    it("Can buy an item", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);

      await approveTx.wait();
      const listingTx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await listingTx.wait();

      const tx = await marketplace
        .connect(signers[1])
        .buyAsset(assetAddress, tokenId, {
          value: ethers.parseEther("1"),
        });
      await tx.wait();

      const listing = await marketplace.getListing(assetAddress, tokenId);
      expect(listing.seller).to.equal(ethers.ZeroAddress);
      expect(listing.price).to.equal(0n);

      const newOwner = await nft.ownerOf(tokenId);
      expect(newOwner).to.equal(signers[1].address);
    });

    it("Cannot buy an item that is not listed", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);

      await approveTx.wait();

      await expect(
        marketplace.connect(signers[1]).buyAsset(assetAddress, tokenId, {
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWithCustomError(marketplace, "NotForSale");
    });

    it("Cannot buy an item with insufficient funds", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);

      await approveTx.wait();
      const listingTx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await listingTx.wait();

      await expect(
        marketplace.connect(signers[1]).buyAsset(assetAddress, tokenId, {
          value: ethers.parseEther("0.5"),
        })
      ).to.be.revertedWithCustomError(marketplace, "NotEnoughEther");
    });

    it("Cannot buy an item that is not an NFT", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);

      await approveTx.wait();
      const listingTx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await listingTx.wait();

      await expect(
        marketplace.connect(signers[1]).buyAsset(signer.address, tokenId, {
          value: ethers.parseEther("1"),
        })
      ).to.be.reverted;
    });

    it("Cannot buy an item that is already sold", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);

      await approveTx.wait();
      const listingTx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await listingTx.wait();

      const tx = await marketplace
        .connect(signers[1])
        .buyAsset(assetAddress, tokenId, {
          value: ethers.parseEther("1"),
        });
      await tx.wait();

      await expect(
        marketplace.connect(signers[2]).buyAsset(assetAddress, tokenId, {
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWithCustomError(marketplace, "NotForSale");
    });

    it("Resets the listing after a sale", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);
      await approveTx.wait();
      const listingTx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await listingTx.wait();
      const tx = await marketplace
        .connect(signers[1])
        .buyAsset(assetAddress, tokenId, { value: ethers.parseEther("1") });
      await tx.wait();
      const listing = await marketplace.getListing(assetAddress, tokenId);
      expect(listing.seller).to.equal(ethers.ZeroAddress);
      expect(listing.price).to.equal(0n);
    });

    it('Emits an "ItemBought" event', async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const buyer = signers[1];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);
      await approveTx.wait();

      const listingTx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await listingTx.wait();

      await listen(marketplace, "ItemBought", {
        onEvent: async (
          _buyer: string,
          nftAddress: string,
          tokenId: bigint,
          price: bigint
        ) => {
          expect(_buyer).to.equal(buyer.address);
          expect(nftAddress).to.equal(assetAddress);
          expect(tokenId).to.equal(tokenId);
          expect(price).to.equal(ethers.parseEther("1"));
        },
        trigger: async () => {
          const tx = await marketplace
            .connect(buyer)
            .buyAsset(assetAddress, tokenId, { value: ethers.parseEther("1") });
          await tx.wait();
        },
      });
    });

    it("Updates the balance of the seller", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const buyer = signers[1];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);
      await approveTx.wait();

      const listingTx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await listingTx.wait();

      const tx = await marketplace
        .connect(buyer)
        .buyAsset(assetAddress, tokenId, { value: ethers.parseEther("1") });
      await tx.wait();

      const balance = await marketplace.getBalance(signer.address);
      expect(balance).to.equal(ethers.parseEther("1"));
    });
  });

  describe("Updating a listing", async () => {
    it("Can update a listing", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);
      await approveTx.wait();

      const listingTx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await listingTx.wait();

      const updateTx = await marketplace
        .connect(signer)
        .updateListing(assetAddress, tokenId, ethers.parseEther("2"));
      await updateTx.wait();

      const listing = await marketplace.getListing(assetAddress, tokenId);
      expect(listing.seller).to.equal(signer.address);
      expect(listing.price).to.equal(ethers.parseEther("2"));
    });

    it("Cannot update a listing that is not listed", async () => {
      const tokenId = 1;
      const signer = signers[tokenId];
      await expect(
        marketplace
          .connect(signer)
          .updateListing(assetAddress, tokenId, ethers.parseEther("2"))
      ).to.be.revertedWithCustomError(marketplace, "NotForSale");
    });

    it("Cannot update a listing that is not owned", async () => {
      const tokenId = 1;
      const signer = signers[tokenId];
      const otherSigner = signers[0];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);

      await approveTx.wait();
      const listingTx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await listingTx.wait();

      await expect(
        marketplace
          .connect(otherSigner)
          .updateListing(assetAddress, tokenId, ethers.parseEther("2"))
      ).to.be.revertedWithCustomError(marketplace, "MustBeOwner");
    });

    it("Cannot update a listing with a price of 0", async () => {
      const tokenId = 1;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);
      await approveTx.wait();

      const listingTx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await listingTx.wait();

      await expect(
        marketplace.connect(signer).updateListing(assetAddress, tokenId, 0n)
      ).to.be.revertedWithCustomError(marketplace, "MustSpecifyPrice");
    });

    it("Cannot update a listing that is not an NFT", async () => {
      const tokenId = 1;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);
      await approveTx.wait();

      const listingTx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await listingTx.wait();

      await expect(
        marketplace
          .connect(signer)
          .updateListing(signer.address, tokenId, ethers.parseEther("2"))
      ).to.be.reverted;
    });

    it('Emits and "ItemListed" event', async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);
      await approveTx.wait();

      const listingTx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await listingTx.wait();

      await listen(marketplace, "ItemListed", {
        onEvent: async (
          seller: string,
          nftAddress: string,
          tokenId: bigint,
          price: bigint
        ) => {
          expect(seller).to.equal(signer.address);
          expect(nftAddress).to.equal(assetAddress);
          expect(tokenId).to.equal(tokenId);
          expect(price).to.equal(ethers.parseEther("2"));
        },
        trigger: async () => {
          const tx = await marketplace
            .connect(signer)
            .updateListing(assetAddress, tokenId, ethers.parseEther("2"));
          await tx.wait();
        },
      });
    });
  });

  describe("Canceling a listing", async () => {
    it("Can cancel a listing", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);
      await approveTx.wait();
      const listingTx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await listingTx.wait();
      const cancelTx = await marketplace
        .connect(signer)
        .cancelListing(assetAddress, tokenId);
      await cancelTx.wait();
      const listing = await marketplace.getListing(assetAddress, tokenId);
      expect(listing.seller).to.equal(ethers.ZeroAddress);
      expect(listing.price).to.equal(0n);
    });

    it("Cannot cancel a listing that is not listed", async () => {
      const tokenId = 1;
      const signer = signers[tokenId];
      await expect(
        marketplace.connect(signer).cancelListing(assetAddress, tokenId)
      ).to.be.revertedWithCustomError(marketplace, "NotForSale");
    });

    it("Cannot cancel a listing that is not owned", async () => {
      const tokenId = 1;
      const signer = signers[tokenId];
      const otherSigner = signers[0];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);
      await approveTx.wait();
      const listingTx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await listingTx.wait();
      await expect(
        marketplace.connect(otherSigner).cancelListing(assetAddress, tokenId)
      ).to.be.revertedWithCustomError(marketplace, "MustBeOwner");
    });

    it("Cannot cancel a listing that is not an NFT", async () => {
      const tokenId = 1;
      const signer = signers[tokenId];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);
      await approveTx.wait();
      const listingTx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await listingTx.wait();
      await expect(
        marketplace.connect(signer).cancelListing(signer.address, tokenId)
      ).to.be.reverted;
    });
  });

  describe("Withdrawal", async () => {
    it("Cannot withdraw funds if there are no funds", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      await expect(marketplace.connect(signer).withdraw()).to.be.reverted;
    });

    it("Can get the balance", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const balance = await marketplace.getBalance(signer.address);
      expect(balance).to.equal(0n);
    });

    it("Can withdraw funds", async () => {
      const tokenId = 0;
      const signer = signers[tokenId];
      const buyer = signers[1];
      const approveTx = await nft
        .connect(signer)
        .approve(await marketplace.getAddress(), tokenId);
      await approveTx.wait();
      const listingTx = await marketplace
        .connect(signer)
        .listAsset(assetAddress, tokenId, ethers.parseEther("1"));
      await listingTx.wait();
      const tx = await marketplace
        .connect(buyer)
        .buyAsset(assetAddress, tokenId, { value: ethers.parseEther("1") });
      await tx.wait();
      const withdrawTx = await marketplace.connect(signer).withdraw();
      await withdrawTx.wait();
      const balance = await ethers.provider.getBalance(signer.address);
      expect(balance).to.be.gt(0);
    });
  });
});
