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

developmentNetworks.includes(network.name)
  ? describe.skip
  : describe("Raffle Staging Tests", () => {
      let raffle: Raffle, deployedRaffleEntranceFee: any;

      beforeEach(async () => {
        const { deployer } = await getNamedAccounts();
        // const r = await deployments.fixture(["all"]);
        raffle = (await ethers.getContract("Raffle", deployer)) as Raffle;
        console.log('raffle.address', await raffle.getAddress())
        deployedRaffleEntranceFee = await raffle.getEntranceFee();
      });

      describe("fulfillRandomWords", async () => {
        it('works with live Chainlink Keepers and Chainlink VRF', async () => {
          const startingTimestamp = await raffle.getLastTimeStamp();
          const { deployer } = await getNamedAccounts();

          await new Promise<void>(async (resolve, rejects) => {
            const timeout = setTimeout(rejects, testDefaultTimeout)
            raffle.once('WinnerPicked', async () => {
              clearTimeout(timeout)
              try {
                const  { deployer } = await getNamedAccounts();
                const recentWinner = await raffle.getRecentWinner()
                const raffleState = await raffle.getRaffleState()
                const winnerBalance = await ethers.provider.getBalance(recentWinner)
                const endingTimestamp = await raffle.getLastTimeStamp();

                await expect(raffle.getPlayer(0)).to.be.reverted;
                assert.equal(recentWinner, deployer)
                assert.equal(raffleState, 0n)
                assert.equal(winnerBalance.toString(), (winnerStartingBalance + deployedRaffleEntranceFee).toString())
                assert(endingTimestamp > startingTimestamp);

                resolve()
              } catch (e) {
                rejects(e)
              }
            })
            console.log('Deployer', deployer)

            const tx = await raffle.enter({
              value: deployedRaffleEntranceFee,
            })
            console.log('tx.hash > ', tx.hash)
            await tx.wait()
            const winnerStartingBalance = await ethers.provider.getBalance(deployer)
          })
        })
      });
    });
