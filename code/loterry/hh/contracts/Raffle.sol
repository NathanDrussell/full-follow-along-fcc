// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

error Raffle__InvalidEntranceFee(uint256 entranceFee);
error Raffle__TransferFailed();
error Raffle__NotOpen();
error Raffle__TooEarly(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);

/**
 * @title Raffle
 * @notice A raffle contract that uses Chainlink VRF to pick a winner
 *
 * @dev This contract uses the VRFConsumerBaseV2 contract to fulfill randomness
 * requests and uses the KeeperCompatible contract to perform upkeep
 * @dev This contract is designed to work on multiple networks, including
 * local test networks
 * @dev This contract is designed to work with the RaffleKeeper contract
 */
contract Raffle is VRFConsumerBaseV2, KeeperCompatible {
    enum RaffleState {
        Open,
        Closed
    }

    event RaffleEnter(address indexed player, uint256 indexed entranceFee);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner, uint256 indexed timestamp);

    // Raffle State
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    address private s_recentWinner;
    uint256 private s_lastTimeStamp;
    RaffleState private s_raffleState;

    // VRF Configuration
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint256 private immutable i_interval;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;

    // VRF Constants
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    constructor(
        address vrfCoordinator,
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinator) {
        i_entranceFee = entranceFee;
        s_raffleState = RaffleState.Open;
        s_lastTimeStamp = block.timestamp;

        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        i_interval = interval;
    }

    receive() external payable {
        enter();
    }

    function enter() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__InvalidEntranceFee(msg.value);
        }

        if (s_raffleState != RaffleState.Open) {
            revert Raffle__NotOpen();
        }

        s_players.push(payable(msg.sender));

        emit RaffleEnter(msg.sender, msg.value);
    }

    function checkUpkeep(bytes memory) public override returns (bool upkeepNeeded, bytes memory) {
        bool isOpen = s_raffleState == RaffleState.Open;
        bool hasBalance = address(this).balance > 0;
        bool isTime = (block.timestamp - s_lastTimeStamp) > i_interval;
        bool hasPlayers = s_players.length > 0;
        bool needsUpkeep = isOpen && hasBalance && isTime && hasPlayers;

        return (needsUpkeep, "");
    }

    function performUpkeep(bytes calldata) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Raffle__TooEarly(address(this).balance, s_players.length, uint256(s_raffleState));
        }
        s_raffleState = RaffleState.Closed;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(uint256, uint256[] memory randomWords) internal override {
        uint256 index = randomWords[0] % s_players.length;
        address payable winner = s_players[index];
        s_recentWinner = winner;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;
        s_raffleState = RaffleState.Open;
        // winner.transfer(address(this).balance);
        (bool success, ) = winner.call{value: address(this).balance}("");

        if (!success) {
            revert Raffle__TransferFailed();
        }

        emit WinnerPicked(winner, block.timestamp);
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumWords() public pure returns (uint32) {
        return NUM_WORDS;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getDelta() public view returns (uint256) {
        return block.timestamp - s_lastTimeStamp;
    }

    function getRequestConfirmations() public pure returns (uint16) {
        return REQUEST_CONFIRMATIONS;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    // performUpkeep(bytes calldata) external override {
    //     requestRandomWinner();
    // }
}
