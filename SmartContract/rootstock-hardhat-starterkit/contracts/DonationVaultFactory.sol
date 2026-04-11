// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./DonationVault.sol";

/// @title DonationVaultFactory
/// @notice Registry and factory for deploying DonationVault instances
/// @dev Any address can deploy a new vault. All deployed vaults are tracked
///      on-chain so they can be discovered without off-chain indexing.
contract DonationVaultFactory {

    // ─── State ───

    /// @notice All vaults ever deployed through this factory
    address[] public vaults;

    /// @notice Maps a vault address to the NGO address it was created for
    mapping(address => address) public vaultNgo;

    // ─── Events ───

    /// @notice Emitted each time a new vault is deployed
    /// @param vault   Address of the newly deployed DonationVault
    /// @param ngo     NGO address that will receive milestone funds
    /// @param verifier Address authorised to release milestones
    /// @param targetAmount Total fundraising goal in wei
    /// @param deployer Caller who triggered the deployment
    event VaultDeployed(
        address indexed vault,
        address indexed ngo,
        address indexed verifier,
        uint256 targetAmount,
        address deployer
    );

    // ─── Errors ───
    error ZeroAddress();
    error EmptyMilestones();

    // ─── External Functions ───

    /// @notice Deploy a new DonationVault and register it in the factory
    /// @param _ngo             NGO address (cannot be zero)
    /// @param _verifier        Verifier address (cannot be zero)
    /// @param _description     Campaign description
    /// @param _targetAmount    Fundraising goal in wei
    /// @param _milestoneAmounts  Per-milestone amounts — must sum to _targetAmount
    /// @param _milestoneDescriptions  Human-readable description per milestone
    /// @return vault Address of the newly deployed DonationVault
    function deployVault(
        address _ngo,
        address _verifier,
        string calldata _description,
        uint256 _targetAmount,
        uint256[] calldata _milestoneAmounts,
        string[] calldata _milestoneDescriptions
    ) external returns (address vault) {
        if (_ngo == address(0)) revert ZeroAddress();
        if (_verifier == address(0)) revert ZeroAddress();
        if (_milestoneAmounts.length == 0) revert EmptyMilestones();

        DonationVault newVault = new DonationVault(
            _ngo,
            _verifier,
            _description,
            _targetAmount,
            _milestoneAmounts,
            _milestoneDescriptions
        );

        vault = address(newVault);
        vaults.push(vault);
        vaultNgo[vault] = _ngo;

        emit VaultDeployed(vault, _ngo, _verifier, _targetAmount, msg.sender);
    }

    /// @notice Returns the total number of vaults deployed through this factory
    function vaultCount() external view returns (uint256) {
        return vaults.length;
    }

    /// @notice Paginated list of vault addresses
    /// @param offset Start index (0-based)
    /// @param limit  Maximum number of addresses to return
    function getVaults(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory page)
    {
        uint256 total = vaults.length;
        if (offset >= total) return new address[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;

        page = new address[](end - offset);
        for (uint256 i = 0; i < page.length; i++) {
            page[i] = vaults[offset + i];
        }
    }
}
