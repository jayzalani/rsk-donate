// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DonationVault {
    address public ngo;
    address public verifier;
    string public description;
    uint256 public targetAmount;
    uint256 public totalRaised;
    uint256 public lastUpdateTimestamp;
    uint256 public constant EXPIRY_WINDOW = 90 days;

    struct Milestone {
        uint256 amount;
        bool released;
        string description;
    }

    Milestone[] public milestones;
    mapping(address => uint256) public contributions;

    event Donated(address indexed donor, uint256 amount);
    event MilestoneReleased(uint256 index, uint256 amount);
    event RefundClaimed(address indexed donor, uint256 amount);
    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);

    constructor(
        address _ngo,
        address _verifier,
        string memory _description,
        uint256 _targetAmount,
        uint256[] memory _milestoneAmounts,
        string[] memory _milestoneDescriptions
    ) {
        // Fix #9 - Zero address validation
        require(_ngo != address(0), "NGO cannot be zero address");
        require(_verifier != address(0), "Verifier cannot be zero address");
        require(_milestoneAmounts.length == _milestoneDescriptions.length, "Mismatching milestones");

        // Fix #5 - Milestone amounts must sum to target
        uint256 sum = 0;
        for (uint i = 0; i < _milestoneAmounts.length; i++) {
            sum += _milestoneAmounts[i];
        }
        require(sum == _targetAmount, "Milestones must sum to target");

        ngo = _ngo;
        verifier = _verifier;
        description = _description;
        targetAmount = _targetAmount;
        lastUpdateTimestamp = block.timestamp;

        for (uint i = 0; i < _milestoneAmounts.length; i++) {
            milestones.push(Milestone(_milestoneAmounts[i], false, _milestoneDescriptions[i]));
        }
    }

    function donate() public payable {
        require(totalRaised < targetAmount, "Target reached");

        // Fix #4 - Cap donation at remaining target, refund excess
        uint256 accepted = msg.value;
        if (totalRaised + msg.value > targetAmount) {
            accepted = targetAmount - totalRaised;
            payable(msg.sender).transfer(msg.value - accepted);
        }

        contributions[msg.sender] += accepted;
        totalRaised += accepted;
        lastUpdateTimestamp = block.timestamp;
        emit Donated(msg.sender, accepted);
    }

    function releaseMilestone(uint256 _index) external {
        require(msg.sender == verifier, "Only verifier can release");
        require(_index < milestones.length, "Invalid milestone index");
        require(!milestones[_index].released, "Already released");
        require(address(this).balance >= milestones[_index].amount, "Insufficient funds");

        milestones[_index].released = true;
        lastUpdateTimestamp = block.timestamp;
        payable(ngo).transfer(milestones[_index].amount);

        emit MilestoneReleased(_index, milestones[_index].amount);
    }

    function claimRefund() external {
        require(block.timestamp > lastUpdateTimestamp + EXPIRY_WINDOW, "Not expired yet");
        uint256 amount = contributions[msg.sender];
        require(amount > 0, "No contribution found");

        contributions[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit RefundClaimed(msg.sender, amount);
    }

    // Fix #6 - Verifier recovery mechanism
    function updateVerifier(address _newVerifier) external {
        require(msg.sender == verifier, "Only verifier");
        require(_newVerifier != address(0), "Zero address");
        emit VerifierUpdated(verifier, _newVerifier);
        verifier = _newVerifier;
    }

    receive() external payable {
        donate();
    }
}