// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract SimpleNFT is ERC721, Ownable {
    constructor() ERC721("SimpleNFT", "SNFT") {}

    uint256 public tokenId = 0;

    function mint() external {
        _mint(msg.sender, tokenId);
        tokenId++;
    }
}
