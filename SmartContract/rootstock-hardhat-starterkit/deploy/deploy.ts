// import { HardhatRuntimeEnvironment } from "hardhat/types";
// import { DeployFunction } from "hardhat-deploy/types";
// import { ethers } from "hardhat";

// const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
//   const { deployments, getNamedAccounts } = hre;
//   const { deploy } = deployments;
//   const { deployer } = await getNamedAccounts();

//   console.log("Starting deployment with account:", deployer);

//   // Parameters
//   const NGO_ADDR = deployer; // Sending funds to yourself for testing
//   const VERIFIER_ADDR = deployer; 
//   const DESCRIPTION = "RSK Charity Initiative";
//   const TARGET = ethers.parseEther("0.01");
  
//   const MILESTONE_AMOUNTS = [ethers.parseEther("0.005"), ethers.parseEther("0.005")];
//   const MILESTONE_DESCS = ["Initial Setup", "Final Delivery"];

//   const deployment = await deploy("DonationVault", {
//     from: deployer,
//     args: [
//       NGO_ADDR,
//       VERIFIER_ADDR,
//       DESCRIPTION,
//       TARGET,
//       MILESTONE_AMOUNTS,
//       MILESTONE_DESCS,
//     ],
//     log: true, // This will automatically print the address to the console
//   });

//   console.log("----------------------------------------------------");
//   console.log("SUCCESS! DonationVault deployed to:", deployment.address);
//   console.log("----------------------------------------------------");
// };

// export default func;
// func.tags = ["DonationVault"];


import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Starting deployment with account:", deployer);

  // ⚠️  TEST CONFIGURATION ONLY
  // NGO_ADDR and VERIFIER_ADDR are both set to the deployer account for
  // convenience during local / testnet development.
  //
  // For a PRODUCTION deployment you MUST replace these with distinct,
  // purpose-specific addresses:
  //   NGO_ADDR      — the organisation's treasury / multisig wallet
  //   VERIFIER_ADDR — a separate auditor / multisig wallet that is NOT
  //                   controlled by the same key as the deployer
  //
  // Using the same address for all three roles removes the trust separation
  // that the contract is designed to provide.
  const NGO_ADDR = deployer;
  const VERIFIER_ADDR = deployer;

  const DESCRIPTION = "RSK Charity Initiative";
  const TARGET = ethers.parseEther("0.01");

  // Milestone amounts must sum exactly to TARGET (Fix #5).
  const MILESTONE_AMOUNTS = [ethers.parseEther("0.005"), ethers.parseEther("0.005")];
  const MILESTONE_DESCS = ["Initial Setup", "Final Delivery"];

  const deployment = await deploy("DonationVault", {
    from: deployer,
    args: [
      NGO_ADDR,
      VERIFIER_ADDR,
      DESCRIPTION,
      TARGET,
      MILESTONE_AMOUNTS,
      MILESTONE_DESCS,
    ],
    log: true,
  });

  console.log("----------------------------------------------------");
  console.log("SUCCESS! DonationVault deployed to:", deployment.address);
  console.log("----------------------------------------------------");
  console.log("NOTE: Copy the contract address above into your");
  console.log("Frontend/frontend/.env.local as NEXT_PUBLIC_CONTRACT_ADDRESS");
  console.log("----------------------------------------------------");
};

export default func;
func.tags = ["DonationVault"];