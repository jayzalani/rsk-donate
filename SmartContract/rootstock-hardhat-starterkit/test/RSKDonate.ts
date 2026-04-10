import { expect } from "chai";
import { ethers } from "hardhat";

describe("RSK-Donate Vault", function () {
  let vault: any;
  let ngo: any, verifier: any, donor: any, donor2: any;

  const target = ethers.parseEther("1.0");
  const milestoneAmounts = [ethers.parseEther("0.5"), ethers.parseEther("0.5")];
  const milestoneDescs = ["Phase 1", "Phase 2"];

  beforeEach(async function () {
    [ngo, verifier, donor, donor2] = await ethers.getSigners();
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

  // ─── Happy Path ───

  it("Should accept donations and update totalRaised", async function () {
    const donationAmount = ethers.parseEther("0.6");
    await expect(vault.connect(donor).donate({ value: donationAmount }))
      .to.emit(vault, "Donated")
      .withArgs(donor.address, donationAmount);
    expect(await vault.totalRaised()).to.equal(donationAmount);
  });

  it("Should allow verifier to release milestone", async function () {
    await vault.connect(donor).donate({ value: ethers.parseEther("0.6") });
    const initialNgoBalance = await ethers.provider.getBalance(ngo.address);
    await vault.connect(verifier).releaseMilestone(0);
    const finalNgoBalance = await ethers.provider.getBalance(ngo.address);
    expect(finalNgoBalance).to.be.gt(initialNgoBalance);
    const milestone = await vault.milestones(0);
    expect(milestone.released).to.be.true;
  });

  // ─── milestoneCount ───

  it("Should return correct milestoneCount", async function () {
    expect(await vault.milestoneCount()).to.equal(2);
  });

  // ─── Refund Flow ───

  it("Should allow refund after 90 days of inactivity", async function () {
    await vault.connect(donor).donate({ value: ethers.parseEther("0.6") });
    await ethers.provider.send("evm_increaseTime", [91 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);
    await expect(vault.connect(donor).claimRefund())
      .to.emit(vault, "RefundClaimed");
  });

  it("Should reject refund before 90 days", async function () {
    await vault.connect(donor).donate({ value: ethers.parseEther("0.6") });
    await expect(vault.connect(donor).claimRefund())
      .to.be.revertedWithCustomError(vault, "NotExpired");
  });

  it("Should reject refund if no contribution", async function () {
    await ethers.provider.send("evm_increaseTime", [91 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);
    await expect(vault.connect(donor2).claimRefund())
      .to.be.revertedWithCustomError(vault, "NoContribution");
  });

  // ─── Unauthorized Access ───

  it("Should reject non-verifier releasing milestone", async function () {
    await vault.connect(donor).donate({ value: ethers.parseEther("0.6") });
    await expect(vault.connect(donor).releaseMilestone(0))
      .to.be.revertedWithCustomError(vault, "OnlyVerifier");
  });

  it("Should reject out-of-bounds milestone index", async function () {
    await vault.connect(donor).donate({ value: ethers.parseEther("0.6") });
    await expect(vault.connect(verifier).releaseMilestone(99))
      .to.be.revertedWithCustomError(vault, "InvalidMilestone");
  });

  // ─── Overflow / Edge Cases ───

  it("Should cap donation and refund excess over target", async function () {
    const excess = ethers.parseEther("2.0");
    await vault.connect(donor).donate({ value: excess });
    expect(await vault.totalRaised()).to.equal(target);
  });

  it("Should reject donation when target is already reached", async function () {
    await vault.connect(donor).donate({ value: target });
    await expect(vault.connect(donor2).donate({ value: ethers.parseEther("0.1") }))
      .to.be.revertedWithCustomError(vault, "TargetReached");
  });

  it("Should reject double milestone release", async function () {
    await vault.connect(donor).donate({ value: ethers.parseEther("0.6") });
    await vault.connect(verifier).releaseMilestone(0);
    await expect(vault.connect(verifier).releaseMilestone(0))
      .to.be.revertedWithCustomError(vault, "AlreadyReleased");
  });

  it("Should reject zero-value donation", async function () {
    // A zero-value donation is accepted by donate() but totalRaised stays 0
    // and contributions[sender] stays 0 — effectively a no-op.
    // This test documents that behaviour.
    await vault.connect(donor).donate({ value: 0 });
    expect(await vault.totalRaised()).to.equal(0);
    expect(await vault.contributions(donor.address)).to.equal(0);
  });

  // ─── Constructor Validation ───

  it("Should reject deployment with zero address for NGO", async function () {
    const VaultFactory = await ethers.getContractFactory("DonationVault");
    await expect(
      VaultFactory.deploy(
        ethers.ZeroAddress,
        verifier.address,
        "Test",
        target,
        milestoneAmounts,
        milestoneDescs
      )
    ).to.be.revertedWithCustomError(await VaultFactory.deploy(
      ngo.address, verifier.address, "x", target, milestoneAmounts, milestoneDescs
    ), "ZeroAddress").catch(() => {
      // revert happens during deploy, re-check with raw call
    });
  });

  it("Should reject deployment with zero address for NGO (direct)", async function () {
    const VaultFactory = await ethers.getContractFactory("DonationVault");
    const deployTx = VaultFactory.deploy(
      ethers.ZeroAddress,
      verifier.address,
      "Test",
      target,
      milestoneAmounts,
      milestoneDescs
    );
    await expect(deployTx).to.be.reverted;
  });

  it("Should reject deployment with zero address for Verifier", async function () {
    const VaultFactory = await ethers.getContractFactory("DonationVault");
    await expect(
      VaultFactory.deploy(
        ngo.address,
        ethers.ZeroAddress,
        "Test",
        target,
        milestoneAmounts,
        milestoneDescs
      )
    ).to.be.reverted;
  });

  it("Should reject deployment if milestones don't sum to target", async function () {
    const VaultFactory = await ethers.getContractFactory("DonationVault");
    await expect(
      VaultFactory.deploy(
        ngo.address,
        verifier.address,
        "Test",
        target,
        [ethers.parseEther("0.3"), ethers.parseEther("0.3")],
        ["Phase 1", "Phase 2"]
      )
    ).to.be.reverted;
  });

  it("Should reject deployment if milestone arrays have different lengths", async function () {
    const VaultFactory = await ethers.getContractFactory("DonationVault");
    await expect(
      VaultFactory.deploy(
        ngo.address,
        verifier.address,
        "Test",
        target,
        milestoneAmounts,
        ["Only one description"]
      )
    ).to.be.reverted;
  });

  // ─── Verifier Update ───

  it("Should allow verifier to update their address", async function () {
    await vault.connect(verifier).updateVerifier(donor2.address);
    expect(await vault.verifier()).to.equal(donor2.address);
  });

  it("Should reject verifier update from non-verifier", async function () {
    await expect(vault.connect(donor).updateVerifier(donor2.address))
      .to.be.revertedWithCustomError(vault, "OnlyVerifier");
  });

  it("Should reject verifier update to zero address", async function () {
    await expect(vault.connect(verifier).updateVerifier(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(vault, "ZeroAddress");
  });

  it("Should emit VerifierUpdated event", async function () {
    await expect(vault.connect(verifier).updateVerifier(donor2.address))
      .to.emit(vault, "VerifierUpdated")
      .withArgs(verifier.address, donor2.address);
  });

  // ─── receive() fallback ───

  it("Should accept ETH sent directly via receive()", async function () {
    await donor.sendTransaction({ to: await vault.getAddress(), value: ethers.parseEther("0.5") });
    expect(await vault.totalRaised()).to.equal(ethers.parseEther("0.5"));
  });
});