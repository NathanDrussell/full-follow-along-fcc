// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NathanRNFTAgreement {
    // Errors
    error InvalidFee(uint256 sent, uint256 expected);
    error InvalidState();
    error AgreementCancelationPeriodOver();

    // Events
    event AgreementCreated(address client, uint256 amount, uint256 duration);
    event AgreementCancelled(address client, uint256 amount);
    event AgreementReleased(address client, uint256 amount);

    // Types
    enum AgreementState {
        Active,
        Cancelled,
        Released
    }

    struct Agreement {
        address client;
        uint256 duration;
        uint256 balance;
        uint256 createdAt;
        AgreementState state;
    }

    // State
    address payable public immutable nathansWallet;
    mapping(address => Agreement) public agreements;
    // Constants
    uint256 public constant BASE_FEE = 0.1 ether;
    uint256 public constant DURATION = 90 days;

    constructor() {
        nathansWallet = payable(msg.sender);
    }

    function create() public payable {
        if (msg.value < BASE_FEE) {
            revert InvalidFee(msg.value, BASE_FEE);
        }

        Agreement memory agreement = Agreement({
            client: msg.sender,
            duration: DURATION,
            balance: msg.value,
            state: AgreementState.Active,
            createdAt: block.timestamp
        });

        agreements[msg.sender] = agreement;

        emit AgreementCreated(msg.sender, msg.value, DURATION);
    }

    function fund() public payable {
        Agreement memory agreement = agreements[msg.sender];

        if (agreement.state != AgreementState.Active) {
            revert InvalidState();
        }

        agreement.balance += msg.value;
    }

    function cancel() public payable {
        uint256 timePassed = block.timestamp - agreements[msg.sender].createdAt;
        Agreement memory agreement = agreements[msg.sender];

        if (agreement.state != AgreementState.Active) {
            revert InvalidState();
        }

        if (timePassed > DURATION) {
            revert AgreementCancelationPeriodOver();
        }

        payable(msg.sender).transfer(agreement.balance);

        agreement.state = AgreementState.Cancelled;
        agreement.balance = 0;

        agreements[msg.sender] = agreement;

        emit AgreementCancelled(msg.sender, agreement.balance);
    }

    function release() public payable {
        Agreement memory agreement = agreements[msg.sender];

        if (agreement.state != AgreementState.Active) {
            revert InvalidState();
        }

        agreement.state = AgreementState.Released;
        agreement.balance = 0;

        nathansWallet.transfer(agreement.balance);

        agreements[msg.sender] = agreement;

        emit AgreementReleased(msg.sender, agreement.balance);
    }

    function getAgreement() public view returns (Agreement memory) {
        return agreements[msg.sender];
    }
}
