import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Starting deployment with account:", deployer);

  // Parameters
  const NGO_ADDR = deployer; // Sending funds to yourself for testing
  const VERIFIER_ADDR = deployer; 
  const DESCRIPTION = "RSK Charity Initiative";
  const TARGET = ethers.parseEther("0.01");
  
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
    log: true, // This will automatically print the address to the console
  });

  console.log("----------------------------------------------------");
  console.log("SUCCESS! DonationVault deployed to:", deployment.address);
  console.log("----------------------------------------------------");
};

export default func;
func.tags = ["DonationVault"];