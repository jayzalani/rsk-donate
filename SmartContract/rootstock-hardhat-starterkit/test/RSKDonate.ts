import { expect } from "chai";
import { ethers } from "hardhat";

describe("RSK-Donate Vault", function () {
  let vault: any;
  let ngo: any, verifier: any, donor: any;

  const target = ethers.parseEther("1.0"); 
  const milestoneAmounts = [ethers.parseEther("0.5"), ethers.parseEther("0.5")];
  const milestoneDescs = ["Phase 1", "Phase 2"];

  beforeEach(async function () {
    [ngo, verifier, donor] = await ethers.getSigners();
    const VaultFactory = await ethers.getContractFactory("DonationVault");
    vault = await VaultFactory.deploy(
      ngo.address,
      verifier.address,
      "Charity Project",
      target,
      milestoneAmounts,
      milestoneDescs
    );
  });

  it("Should accept donations and update totalRaised", async function () {
    const donationAmount = ethers.parseEther("0.6");
    
    // Using the explicit .donate() call for better test reliability
    await expect(vault.connect(donor).donate({ value: donationAmount }))
      .to.emit(vault, "Donated")
      .withArgs(donor.address, donationAmount);

    const raised = await vault.totalRaised();
    expect(raised).to.equal(donationAmount);
  });

  it("Should allow verifier to release milestone", async function () {
    // Fund the project first
    await vault.connect(donor).donate({ value: ethers.parseEther("0.6") });

    const initialNgoBalance = await ethers.provider.getBalance(ngo.address);
    
    // Verifier releases the first milestone (0.5 rBTC)
    await vault.connect(verifier).releaseMilestone(0);
    
    const finalNgoBalance = await ethers.provider.getBalance(ngo.address);
    expect(finalNgoBalance).to.be.gt(initialNgoBalance);
    
    const milestone = await vault.milestones(0);
    expect(milestone.released).to.be.true;
  });
});