// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

contract Simple {
    address public ownerAddress;

    constructor() {
        ownerAddress = msg.sender;
    }
}
