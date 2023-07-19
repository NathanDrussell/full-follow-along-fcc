// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract Marketplace is ReentrancyGuard, Ownable {
    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    error MustSpecifyPrice();
    error MustBeApproved();
    error MustBeOwner();
    error AlreadyListed();
    error NotForSale();
    error NotEnoughEther();
    error TransferFailed();

    struct Listing {
        address seller;
        uint256 price;
    }

    mapping(address => mapping(uint256 => Listing)) private s_listings;
    mapping(address => uint256) private s_balances;

    modifier notListed(address _nftAddress, uint256 _tokenId) {
        if (s_listings[_nftAddress][_tokenId].price != 0)
            revert AlreadyListed();
        _;
    }

    modifier isSeller(
        address _nftAddress,
        uint256 _tokenId,
        address _seller
    ) {
        IERC721 asset = IERC721(_nftAddress);
        if (asset.ownerOf(_tokenId) != _seller) revert MustBeOwner();
        _;
    }

    modifier isListed(address _nftAddress, uint256 _tokenId) {
        if (s_listings[_nftAddress][_tokenId].price == 0) revert NotForSale();
        _;
    }

    function listAsset(
        address _nftAddress,
        uint256 _tokenId,
        uint256 _price
    )
        external
        notListed(_nftAddress, _tokenId)
        isSeller(_nftAddress, _tokenId, msg.sender)
    {
        if (_price == 0) revert MustSpecifyPrice();
        IERC721 asset = IERC721(_nftAddress);

        if (asset.getApproved(_tokenId) != address(this))
            revert MustBeApproved();

        Listing memory listing = Listing(msg.sender, _price);
        s_listings[_nftAddress][_tokenId] = listing;

        emit ItemListed(msg.sender, _nftAddress, _tokenId, _price);
    }

    function buyAsset(
        address _nftAddress,
        uint256 _tokenId
    ) external payable nonReentrant isListed(_nftAddress, _tokenId) {
        Listing memory listing = s_listings[_nftAddress][_tokenId];
        if (msg.value < listing.price) revert NotEnoughEther();

        s_balances[listing.seller] += listing.price;
        delete s_listings[_nftAddress][_tokenId];

        IERC721 asset = IERC721(_nftAddress);
        asset.safeTransferFrom(listing.seller, msg.sender, _tokenId);

        emit ItemBought(msg.sender, _nftAddress, _tokenId, listing.price);
    }

    function cancelListing(
        address _nftAddress,
        uint256 _tokenId
    )
        external
        isListed(_nftAddress, _tokenId)
        isSeller(_nftAddress, _tokenId, msg.sender)
    {
        delete s_listings[_nftAddress][_tokenId];
    }

    function updateListing(
        address _nftAddress,
        uint256 _tokenId,
        uint256 _price
    )
        external
        nonReentrant
        isListed(_nftAddress, _tokenId)
        isSeller(_nftAddress, _tokenId, msg.sender)
    {
        if (_price == 0) revert MustSpecifyPrice();
        s_listings[_nftAddress][_tokenId].price = _price;

        emit ItemListed(msg.sender, _nftAddress, _tokenId, _price);
    }

    function withdraw() external payable nonReentrant {
        uint256 amount = s_balances[msg.sender];
        if (amount <= 0) revert NotEnoughEther();

        s_balances[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    function getBalance(address _seller) external view returns (uint256) {
        return s_balances[_seller];
    }

    function getListing(
        address _nftAddress,
        uint256 _tokenId
    ) external view returns (Listing memory) {
        return s_listings[_nftAddress][_tokenId];
    }
}
