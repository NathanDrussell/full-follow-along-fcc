import { assert, expect } from "chai";
import { EventLog } from "ethers";
import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { promise } from "zod";
import { developmentNetworks } from "../hardhat.config";
import { networkConfigs, testDefaultTimeout } from "../helper-hardhat.config";
import { Raffle, VRFCoordinatorV2Mock } from "../typechain-types";

const networkConfig = networkConfigs[network.name as keyof typeof networkConfigs];
// error Raffle__InvalidEntranceFee(uint256 entranceFee);
// error Raffle__TransferFailed();
// error Raffle__NotOpen();
// error Raffle__TooEarly(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);

// event RaffleEnter(address indexed player, uint256 indexed entranceFee, uint256 indexed timestamp);
// event RequestedRaffleWinner(uint256 indexed requestId);
// event WinnerPicked(address indexed winner, uint256 indexed timestamp);

!developmentNetworks.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Tests", () => {
      let raffle: Raffle, vrfCoordinatorV2Mock: VRFCoordinatorV2Mock, deployedRaffleEntranceFee: any, interval: bigint;

      beforeEach(async () => {
        const { deployer } = await getNamedAccounts();
        const r = await deployments.fixture(["all"]);
        raffle = (await ethers.getContract("Raffle", deployer)) as Raffle;
        vrfCoordinatorV2Mock = (await ethers.getContract("VRFCoordinatorV2Mock", deployer)) as VRFCoordinatorV2Mock;

        deployedRaffleEntranceFee = await raffle.getEntranceFee();
        interval = await raffle.getInterval();
      });

      describe("constructor", async () => {
        it("Initializes the contract", async () => {
          const raffleState = await raffle.getRaffleState();
          const interval = await raffle.getInterval();
          const entranceFee = await raffle.getEntranceFee();

          assert.equal(raffleState.toString(), "0");
          assert.equal(interval.toString(), networkConfig.contractValues.Raffle.interval.toString());
          assert.equal(entranceFee.toString(), networkConfig.contractValues.Raffle.entranceFee.toString());
        });
      });

      describe("enter", async () => {
        it("Reverts if the entrance fee is not paid", async () => {
          await expect(raffle.enter()).to.be.revertedWithCustomError(
            raffle,
            "Raffle__InvalidEntranceFee(uint256 entranceFee)",
          );
        });

        it("Records the player", async () => {
          const { deployer } = await getNamedAccounts();
          await raffle.enter({ value: deployedRaffleEntranceFee });
          const playerAddress = await raffle.getPlayer(0);
          assert.equal(playerAddress, deployer);
        });

        it("Emits an event", async () => {
          const { deployer } = await getNamedAccounts();
          await expect(raffle.enter({ value: deployedRaffleEntranceFee }))
            .to.emit(raffle, "RaffleEnter")
            .withArgs(deployer, deployedRaffleEntranceFee);
        });

        it("Cannot enter if the raffle is not open", async () => {
          const { deployer } = await getNamedAccounts();
          await raffle.enter({ value: deployedRaffleEntranceFee });
          await network.provider.send("evm_increaseTime", [+(interval + 1n).toString()]);
          await network.provider.send("evm_mine");
          await raffle.performUpkeep(ethers.getBytes("0x00"));
          await expect(raffle.enter({ value: deployedRaffleEntranceFee })).to.be.revertedWithCustomError(
            raffle,
            "Raffle__NotOpen()",
          );
        });
      });

      describe("checkUpkeep", async () => {
        it("returns false if not enough time has passed", async () => {
          const delta = await raffle.getDelta();
          expect(delta).to.be.lt(interval);
          const [upkeepNeded] = await raffle.checkUpkeep.staticCallResult(ethers.getBytes("0x00"));
          assert(!upkeepNeded);
        });

        it("returns false if the raffle is not open", async () => {
          await raffle.enter({ value: deployedRaffleEntranceFee });
          await network.provider.send("evm_increaseTime", [+(interval + 1n).toString()]);
          await network.provider.send("evm_mine");
          await raffle.performUpkeep(ethers.getBytes("0x00"));
          const stateAfterUpkeep = await raffle.getRaffleState();
          assert.equal(stateAfterUpkeep.toString(), "1");
          const [upkeepNeded] = await raffle.checkUpkeep.staticCallResult(ethers.getBytes("0x00"));
          assert(!upkeepNeded);
        });

        it("returns false is not enough players have entered", async () => {
          await network.provider.send("evm_increaseTime", [+(interval + 1n).toString()]);
          await network.provider.send("evm_mine");
          const numberPlayers = await raffle.getNumberOfPlayers();
          expect(numberPlayers).to.be.eq(0);
          const [upkeepNeded] = await raffle.checkUpkeep.staticCallResult(ethers.getBytes("0x00"));
          assert(!upkeepNeded);
        });

        it("Should return true if enough time has passed and enough players have entered", async () => {
          await raffle.enter({ value: deployedRaffleEntranceFee });
          await network.provider.send("evm_increaseTime", [+(interval + 1n).toString()]);
          await network.provider.send("evm_mine");
          const numberPlayers = await raffle.getNumberOfPlayers();
          expect(numberPlayers).to.be.eq(1);
          const [upkeepNeded] = await raffle.checkUpkeep.staticCallResult(ethers.getBytes("0x00"));
          assert(upkeepNeded);
        });
      });

      describe("performUpkeep", async () => {
        it("Only runs if checkUpkeep returns true", async () => {
          await raffle.enter({ value: deployedRaffleEntranceFee });
          await network.provider.send("evm_increaseTime", [+(interval + 1n).toString()]);
          await network.provider.send("evm_mine");
          const numberPlayers = await raffle.getNumberOfPlayers();
          expect(numberPlayers.toString()).to.be.eq("1");
          const tx = await raffle.performUpkeep(ethers.getBytes("0x00"));

          assert(tx);
        });

        it("Reverts if checkUpkeep returns false", async () => {
          await expect(raffle.performUpkeep(ethers.getBytes("0x00"))).to.be.revertedWithCustomError(
            raffle,
            "Raffle__TooEarly(uint256 currentBalance, uint256 numPlayers, uint256 raffleState)",
          );
        });

        it("Updates the raffle state and emits an event", async () => {
          await raffle.enter({ value: deployedRaffleEntranceFee });
          await network.provider.send("evm_increaseTime", [+(interval + 1n).toString()]);
          await network.provider.send("evm_mine");
          const numberPlayers = await raffle.getNumberOfPlayers();
          expect(numberPlayers.toString()).to.be.eq("1");
          const txRes = await raffle.performUpkeep(ethers.getBytes("0x00"));
          const txReceipt = await txRes.wait();
          const raffleState = await raffle.getRaffleState();
          assert.equal(raffleState.toString(), "1");
          const requestId = (txReceipt!.logs[1] as EventLog).args?.[0]; // Maybe...
          expect(requestId).to.be.gt(0);
        });
      });

      describe("fulfillRandomWords", async () => {
        beforeEach(async () => {
          await raffle.enter({ value: deployedRaffleEntranceFee });
          await network.provider.send("evm_increaseTime", [+(interval + 1n).toString()]);
          await network.provider.send("evm_mine");
        });

        it("Can only be called after performUpkeep", async () => {
          await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, await raffle.getAddress())).to.be.revertedWith(
            "nonexistent request",
          );
          await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1, await raffle.getAddress())).to.be.revertedWith(
            "nonexistent request",
          );
        });

        it("picks a winner, resets the lottery, and emits an event", async () => {
          const players = 3;
          const startingAccountIndex = 1;
          const accounts = await ethers.getSigners();
          const addresses = accounts.map((a) => a.address);

          for (let i = startingAccountIndex; i < players + startingAccountIndex; i++) {
            const playerRaffle = (await ethers.getContract("Raffle", accounts[i])) as Raffle;
            await playerRaffle.enter({ value: deployedRaffleEntranceFee });
          }
          const startingTimestamp = await raffle.getLastTimeStamp();
          const expectedWinner = addresses[startingAccountIndex];
          const expectedWinnerBalance = await ethers.provider.getBalance(expectedWinner);

          await new Promise<void>(async (resolve, reject) => {
            const timeout = setTimeout(() => reject(), testDefaultTimeout);
            raffle.once("WinnerPicked", async (winner, timestamp) => {
              clearTimeout(timeout);

              try {
                const recentWinner = await raffle.getRecentWinner();
                const raffleState = await raffle.getRaffleState();
                const numberPlayers = await raffle.getNumberOfPlayers();
                const lastTimeStamp = await raffle.getLastTimeStamp();

                assert.equal(raffleState.toString(), "0");
                assert.equal(numberPlayers.toString(), "0");
                expect(addresses.slice(0, players)).to.include(recentWinner.toString());
                expect(lastTimeStamp).to.be.gt(startingTimestamp);

                const winnerIndex = addresses.indexOf(recentWinner.toString());
                const winnerNewBalance = await ethers.provider.getBalance(addresses[winnerIndex]);

                expect(winnerNewBalance).to.equal(
                  expectedWinnerBalance + deployedRaffleEntranceFee * BigInt(players + startingAccountIndex),
                );
                resolve();
              } catch (e) {
                reject(e);
              }
            });

            const txRes = await raffle.performUpkeep(ethers.getBytes("0x00"));
            const txReceipt = await txRes.wait();
            const requestId = (txReceipt!.logs[1] as EventLog).args?.[0]; // Maybe...
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, await raffle.getAddress());
          });
        });
      });
    });
