import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying DonationVaultFactory with account:", deployer);

  const factory = await deploy("DonationVaultFactory", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log("----------------------------------------------------");
  console.log("DonationVaultFactory deployed to:", factory.address);
  console.log("----------------------------------------------------");
};

export default func;
func.tags = ["DonationVaultFactory"];