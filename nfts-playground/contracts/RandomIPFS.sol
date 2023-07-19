// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract RandomizedNFT is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    error InvalidBreed(uint256 rng);
    error NotEnoughEth();
    enum Breed {
        PUG,
        SHIBA_INU,
        GOLDEN_RETRIEVER
    }

    event NftRequested(uint256 indexed requestId, address indexed requester);
    event NftMinted(Breed indexed breed, address indexed owner);

    // Verifiable Random Number Setup
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    mapping(uint256 => address) private s_requestsAddresses;

    string[3] BREEDS = [
        "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
        "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
        "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm"
    ];

    // NFT State
    uint32 private constant MAX_CHANCE = 100;
    uint256 private s_minted;
    uint256 private s_mintPrice;

    constructor(
        address vrfCoordinatorV2Address,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        uint256 mintPrice
    ) VRFConsumerBaseV2(vrfCoordinatorV2Address) ERC721("Doggy", "DOG") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2Address);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        s_mintPrice = mintPrice;
    }

    function requestNft() public payable returns (uint256) {
        if (msg.value < s_mintPrice) {
            revert NotEnoughEth();
        }
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        s_requestsAddresses[requestId] = msg.sender;

        emit NftRequested(requestId, msg.sender);
        return requestId;
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        address owner = s_requestsAddresses[requestId];
        uint256 moddedRng = randomWords[0] % MAX_CHANCE;
        Breed breed = getBreed(moddedRng);

        _safeMint(owner, s_minted);
        _setTokenURI(s_minted, BREEDS[uint256(breed)]);
        s_minted++;
        emit NftMinted(breed, owner);
    }

    function getBreed(uint256 rng) internal pure returns (Breed) {
        uint256 cum = 0;
        uint32[3] memory chances = getChanceArray();
        for (uint256 i = 0; i < chances.length; i++) {
            if (rng >= cum && rng < cum + chances[i]) {
                // TODO: Figure out how to get a Breed from an index
                return Breed(i);
            }
            cum += chances[i];
        }

        revert InvalidBreed(rng);
    }

    function getChanceArray() public pure returns (uint32[3] memory) {
        return [10, 30, MAX_CHANCE];
    }

    function withdraw() public onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}(
            ""
        );

        if (!success) {
            revert("Withdraw failed");
        }
    }

    function getMintFee() public view returns (uint256) {
        return s_mintPrice;
    }

    function getMinted() public view returns (uint256) {
        return s_minted;
    }

    function getBreedUri(Breed breed) public view returns (string memory) {
        return BREEDS[uint256(breed)];
    }
}
