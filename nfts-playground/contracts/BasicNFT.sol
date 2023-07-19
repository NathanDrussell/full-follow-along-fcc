// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BasicNFT is ERC721 {
    string private constant TOKEN_URI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4";
    uint256 private s_minted;

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {}

    function mintUnbounded() public {
        _safeMint(msg.sender, s_minted);
        s_minted++;
    }

    function getMinted() public view returns (uint256) {
        return s_minted;
    }

    function tokenURI(uint256) public pure override returns (string memory) {
        return TOKEN_URI;
    }
}
