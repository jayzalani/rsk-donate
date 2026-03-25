// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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

    constructor(
        address _ngo,
        address _verifier,
        string memory _description,
        uint256 _targetAmount,
        uint256[] memory _milestoneAmounts,
        string[] memory _milestoneDescriptions
    ) {
        require(_milestoneAmounts.length == _milestoneDescriptions.length, "Mismatching milestones");
        ngo = _ngo;
        verifier = _verifier;
        description = _description;
        targetAmount = _targetAmount;
        lastUpdateTimestamp = block.timestamp;

        for (uint i = 0; i < _milestoneAmounts.length; i++) {
            milestones.push(Milestone(_milestoneAmounts[i], false, _milestoneDescriptions[i]));
        }
    }

    // CHANGED: Visibility to 'public' so receive() can call it internally
    function donate() public payable {
        require(totalRaised < targetAmount, "Target reached");
        contributions[msg.sender] += msg.value;
        totalRaised += msg.value;
        lastUpdateTimestamp = block.timestamp;
        emit Donated(msg.sender, msg.value);
    }

    function releaseMilestone(uint256 _index) external {
        require(msg.sender == verifier, "Only verifier can release");
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

    // This now works perfectly without 'this.'
    receive() external payable { 
        donate(); 
    }
}