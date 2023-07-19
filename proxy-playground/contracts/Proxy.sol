// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract BoxProxyAdmin is ProxyAdmin {
    constructor(address) ProxyAdmin() {}
}
