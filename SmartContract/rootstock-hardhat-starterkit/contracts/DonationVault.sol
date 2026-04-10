// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DonationVault
/// @notice Escrow contract for milestone-based NGO donations on Rootstock
/// @dev Funds are released by a verifier upon milestone completion.
///      Donors can reclaim after 90 days of inactivity.
contract DonationVault {
    /// @notice Address of the NGO receiving released milestone funds
    address public ngo;

    /// @notice Address authorized to release milestones
    address public verifier;

    /// @notice Human-readable campaign description
    string public description;

    /// @notice Total fundraising target in wei
    uint256 public targetAmount;

    /// @notice Total amount donated so far in wei
    uint256 public totalRaised;

    /// @notice Timestamp of last contract activity (donation or milestone release)
    uint256 public lastUpdateTimestamp;

    /// @notice Inactivity period after which donors may claim refunds
    uint256 public constant EXPIRY_WINDOW = 90 days;

    /// @notice Represents a single fundraising milestone
    struct Milestone {
        uint256 amount;     // wei to release upon completion
        bool released;      // whether funds have been sent to NGO
        string description; // human-readable milestone description
    }

    Milestone[] public milestones;

    /// @notice Tracks each donor's total contribution in wei
    mapping(address => uint256) public contributions;

    // ─── Custom Errors (Fix #19 - more gas-efficient than require strings) ───
    error ZeroAddress();
    error MilestoneMismatch();
    error MilestoneSumMismatch();
    error TargetReached();
    error OnlyVerifier();
    error InvalidMilestone();
    error AlreadyReleased();
    error InsufficientFunds();
    error NotExpired();
    error NoContribution();

    // ─── Events (Fix #20 - all relevant params indexed) ───
    event Donated(address indexed donor, uint256 amount);
    event MilestoneReleased(uint256 indexed index, uint256 indexed amount);
    event RefundClaimed(address indexed donor, uint256 indexed amount);
    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);

    /// @notice Deploy a new DonationVault
    /// @param _ngo Address that receives released milestone funds (cannot be zero)
    /// @param _verifier Address authorized to release milestones (cannot be zero)
    /// @param _description Campaign description string
    /// @param _targetAmount Total fundraising target in wei
    /// @param _milestoneAmounts Array of wei amounts per milestone — must sum to _targetAmount
    /// @param _milestoneDescriptions Array of descriptions, must match _milestoneAmounts length
    constructor(
        address _ngo,
        address _verifier,
        string memory _description,
        uint256 _targetAmount,
        uint256[] memory _milestoneAmounts,
        string[] memory _milestoneDescriptions
    ) {
        // Fix #9 — Zero address validation
        if (_ngo == address(0)) revert ZeroAddress();
        if (_verifier == address(0)) revert ZeroAddress();

        if (_milestoneAmounts.length != _milestoneDescriptions.length) revert MilestoneMismatch();

        // Fix #5 — Milestone amounts must sum exactly to target
        uint256 sum = 0;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            sum += _milestoneAmounts[i];
        }
        if (sum != _targetAmount) revert MilestoneSumMismatch();

        ngo = _ngo;
        verifier = _verifier;
        description = _description;
        targetAmount = _targetAmount;
        lastUpdateTimestamp = block.timestamp;

        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            milestones.push(Milestone(_milestoneAmounts[i], false, _milestoneDescriptions[i]));
        }
    }

    /// @notice Donate to the campaign
    /// @dev Any amount exceeding the remaining target is automatically refunded to sender
    function donate() public payable {
        // Fix #4 — Guard against overflow past target
        if (totalRaised >= targetAmount) revert TargetReached();

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

    /// @notice Release a milestone's funds to the NGO
    /// @dev Only callable by the verifier address
    /// @param _index Index of the milestone to release (0-based)
    function releaseMilestone(uint256 _index) external {
        if (msg.sender != verifier) revert OnlyVerifier();
        if (_index >= milestones.length) revert InvalidMilestone();
        if (milestones[_index].released) revert AlreadyReleased();
        if (address(this).balance < milestones[_index].amount) revert InsufficientFunds();

        milestones[_index].released = true;
        lastUpdateTimestamp = block.timestamp;
        payable(ngo).transfer(milestones[_index].amount);

        emit MilestoneReleased(_index, milestones[_index].amount);
    }

    /// @notice Claim a full refund of your contribution
    /// @dev Only available after EXPIRY_WINDOW of contract inactivity
    function claimRefund() external {
        if (block.timestamp <= lastUpdateTimestamp + EXPIRY_WINDOW) revert NotExpired();

        uint256 amount = contributions[msg.sender];
        if (amount == 0) revert NoContribution();

        contributions[msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit RefundClaimed(msg.sender, amount);
    }

    /// @notice Transfer the verifier role to a new address
    /// @dev Fix #6 — recovery mechanism so funds are never permanently locked
    /// @param _newVerifier New verifier address (cannot be zero)
    function updateVerifier(address _newVerifier) external {
        if (msg.sender != verifier) revert OnlyVerifier();
        if (_newVerifier == address(0)) revert ZeroAddress();

        emit VerifierUpdated(verifier, _newVerifier);
        verifier = _newVerifier;
    }

    /// @notice Returns the total number of milestones
    /// @dev Fix #15 — exposes count so frontend doesn't need to brute-force indices
    /// @return count Number of milestones in this vault
    function milestoneCount() external view returns (uint256) {
        return milestones.length;
    }

    /// @dev Fallback to accept plain ETH transfers as donations
    receive() external payable {
        donate();
    }
}