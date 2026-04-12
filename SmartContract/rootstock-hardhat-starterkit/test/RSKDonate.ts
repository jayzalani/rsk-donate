import { expect } from "chai";
import { ethers } from "hardhat";

describe("RSK-Donate Vault", function () {
  let vault: any;
  let ngo: any, verifier: any, donor: any, donor2: any;

  // target = 1.0 ETH → cap per donor = 0.1 ETH
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

  // ─── Helper ───────────────────────────────────────────────────────────
  // Small vault: target=2.0 ETH → cap per donor = 0.2 ETH
  // milestone[0] = 1.0 ETH, milestone[1] = 1.0 ETH
  // Fund milestone[0] by getting 5 signers to donate 0.2 ETH each.
  async function deploySmallVault() {
    const VF = await ethers.getContractFactory("DonationVault");
    return VF.deploy(
      ngo.address,
      verifier.address,
      "Small",
      ethers.parseEther("2.0"),
      [ethers.parseEther("1.0"), ethers.parseEther("1.0")],
      ["M1", "M2"]
    );
  }

  async function fundSmallVaultMilestone0(sv: any) {
    const signers = await ethers.getSigners();
    for (let i = 0; i < 5; i++) {
      await sv.connect(signers[i]).donate({ value: ethers.parseEther("0.2") });
    }
  }

  // ─── Happy Path ───────────────────────────────────────────────────────

  it("Should accept donations and update totalRaised", async function () {
    const donationAmount = ethers.parseEther("0.1");
    await expect(vault.connect(donor).donate({ value: donationAmount }))
      .to.emit(vault, "Donated")
      .withArgs(donor.address, donationAmount);
    expect(await vault.totalRaised()).to.equal(donationAmount);
  });

  it("Should allow verifier to release milestone", async function () {
    const sv = await deploySmallVault();
    await fundSmallVaultMilestone0(sv);
    const initialNgoBalance = await ethers.provider.getBalance(ngo.address);
    await sv.connect(verifier).releaseMilestone(0);
    const finalNgoBalance = await ethers.provider.getBalance(ngo.address);
    expect(finalNgoBalance).to.be.gt(initialNgoBalance);
    const milestone = await sv.milestones(0);
    expect(milestone.released).to.be.true;
  });

  // ─── milestoneCount ───────────────────────────────────────────────────

  it("Should return correct milestoneCount", async function () {
    expect(await vault.milestoneCount()).to.equal(2);
  });

  // ─── Per-Donor Cap ────────────────────────────────────────────────────

  it("Should enforce maxContributionPerDonor (10% of target)", async function () {
    // cap = 1.0 ETH / 10 = 0.1 ETH
    await vault.connect(donor).donate({ value: ethers.parseEther("0.1") });
    expect(await vault.contributions(donor.address)).to.equal(ethers.parseEther("0.1"));
    // Any further donation from the same address must revert
    await expect(
      vault.connect(donor).donate({ value: ethers.parseEther("0.001") })
    ).to.be.revertedWithCustomError(vault, "ExceedsDonorCap");
  });

  it("Should allow multiple donors up to their own cap independently", async function () {
    await vault.connect(donor).donate({ value: ethers.parseEther("0.1") });
    await vault.connect(donor2).donate({ value: ethers.parseEther("0.1") });
    expect(await vault.totalRaised()).to.equal(ethers.parseEther("0.2"));
  });

  // ─── Zero Donation ────────────────────────────────────────────────────

  it("Should reject zero-value donation", async function () {
    await expect(
      vault.connect(donor).donate({ value: 0 })
    ).to.be.revertedWithCustomError(vault, "ZeroDonation");
  });

  it("Should reject zero ETH sent via receive() fallback", async function () {
    await expect(
      donor.sendTransaction({ to: await vault.getAddress(), value: 0 })
    ).to.be.revertedWithCustomError(vault, "ZeroDonation");
  });

  // ─── Overflow / Target Cap ────────────────────────────────────────────

  it("Should cap donation and refund excess over target", async function () {
    // 10 distinct signers × 0.1 ETH = exactly 1.0 ETH = target
    const signers = await ethers.getSigners();
    for (let i = 0; i < 10; i++) {
      await vault.connect(signers[i]).donate({ value: ethers.parseEther("0.1") });
    }
    expect(await vault.totalRaised()).to.equal(target);
  });

  it("Should refund excess when a donation would overshoot the target", async function () {
    const signers = await ethers.getSigners();
    // Fill 9 slots → 0.9 ETH raised, 0.1 ETH remaining
    for (let i = 0; i < 9; i++) {
      await vault.connect(signers[i]).donate({ value: ethers.parseEther("0.1") });
    }
    const balanceBefore = await ethers.provider.getBalance(signers[9].address);
    const tx = await vault.connect(signers[9]).donate({ value: ethers.parseEther("0.1") });
    const receipt = await tx.wait();
    const gasUsed = BigInt(receipt!.gasUsed) * receipt!.gasPrice;
    const balanceAfter = await ethers.provider.getBalance(signers[9].address);
    expect(balanceBefore - balanceAfter - gasUsed).to.equal(ethers.parseEther("0.1"));
    expect(await vault.totalRaised()).to.equal(target);
  });

  it("Should reject donation when target is already reached", async function () {
    const signers = await ethers.getSigners();
    for (let i = 0; i < 10; i++) {
      await vault.connect(signers[i]).donate({ value: ethers.parseEther("0.1") });
    }
    await expect(
      signers[10].sendTransaction({
        to: await vault.getAddress(),
        value: ethers.parseEther("0.001"),
      })
    ).to.be.revertedWithCustomError(vault, "TargetReached");
  });

  // ─── Refund Flow ──────────────────────────────────────────────────────

  it("Should allow refund after 90 days of inactivity", async function () {
    await vault.connect(donor).donate({ value: ethers.parseEther("0.1") });
    await ethers.provider.send("evm_increaseTime", [91 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);
    await expect(vault.connect(donor).claimRefund())
      .to.emit(vault, "RefundClaimed");
  });

  it("Should reject refund before 90 days", async function () {
    await vault.connect(donor).donate({ value: ethers.parseEther("0.1") });
    await expect(vault.connect(donor).claimRefund())
      .to.be.revertedWithCustomError(vault, "NotExpired");
  });

  it("Should reject refund if no contribution", async function () {
    await ethers.provider.send("evm_increaseTime", [91 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);
    await expect(vault.connect(donor2).claimRefund())
      .to.be.revertedWithCustomError(vault, "NoContribution");
  });

  it("Should zero out contribution mapping after refund", async function () {
    await vault.connect(donor).donate({ value: ethers.parseEther("0.1") });
    await ethers.provider.send("evm_increaseTime", [91 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);
    await vault.connect(donor).claimRefund();
    expect(await vault.contributions(donor.address)).to.equal(0);
    // Second refund must fail
    await expect(vault.connect(donor).claimRefund())
      .to.be.revertedWithCustomError(vault, "NoContribution");
  });

  // ─── Unauthorized Access ──────────────────────────────────────────────

  it("Should reject non-verifier releasing milestone", async function () {
    await vault.connect(donor).donate({ value: ethers.parseEther("0.1") });
    await expect(vault.connect(donor).releaseMilestone(0))
      .to.be.revertedWithCustomError(vault, "OnlyVerifier");
  });

  it("Should reject out-of-bounds milestone index", async function () {
    await vault.connect(donor).donate({ value: ethers.parseEther("0.1") });
    await expect(vault.connect(verifier).releaseMilestone(99))
      .to.be.revertedWithCustomError(vault, "InvalidMilestone");
  });

  it("Should reject double milestone release", async function () {
    const sv = await deploySmallVault();
    await fundSmallVaultMilestone0(sv);
    await sv.connect(verifier).releaseMilestone(0);
    await expect(sv.connect(verifier).releaseMilestone(0))
      .to.be.revertedWithCustomError(sv, "AlreadyReleased");
  });

  // ─── Constructor Validation ───────────────────────────────────────────

  it("Should reject deployment with zero address for NGO", async function () {
    const VF = await ethers.getContractFactory("DonationVault");
    await expect(
      VF.deploy(
        ethers.ZeroAddress,
        verifier.address,
        "Test",
        target,
        milestoneAmounts,
        milestoneDescs
      )
    ).to.be.revertedWithCustomError(VF, "ZeroAddress");
  });

  it("Should reject deployment with zero address for Verifier", async function () {
    const VF = await ethers.getContractFactory("DonationVault");
    await expect(
      VF.deploy(
        ngo.address,
        ethers.ZeroAddress,
        "Test",
        target,
        milestoneAmounts,
        milestoneDescs
      )
    ).to.be.revertedWithCustomError(VF, "ZeroAddress");
  });

  it("Should reject deployment if milestones don't sum to target", async function () {
    const VF = await ethers.getContractFactory("DonationVault");
    await expect(
      VF.deploy(
        ngo.address,
        verifier.address,
        "Test",
        target,
        [ethers.parseEther("0.3"), ethers.parseEther("0.3")],
        ["Phase 1", "Phase 2"]
      )
    ).to.be.revertedWithCustomError(VF, "MilestoneSumMismatch");
  });

  it("Should reject deployment if milestone arrays have different lengths", async function () {
    const VF = await ethers.getContractFactory("DonationVault");
    await expect(
      VF.deploy(
        ngo.address,
        verifier.address,
        "Test",
        target,
        milestoneAmounts,
        ["Only one description"]
      )
    ).to.be.revertedWithCustomError(VF, "MilestoneMismatch");
  });

  // ─── receive() Fallback ───────────────────────────────────────────────

  it("Should accept ETH sent directly via receive() fallback", async function () {
    await donor.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("0.05"),
    });
    expect(await vault.totalRaised()).to.equal(ethers.parseEther("0.05"));
  });

  // ─── Verifier Handoff (2-step time-locked rotation) ───────────────────

  it("Should allow verifier to request a handoff and set pendingVerifier", async function () {
    await expect(vault.connect(verifier).requestVerifierHandoff(donor2.address))
      .to.emit(vault, "VerifierHandoffRequested");
    expect(await vault.pendingVerifier()).to.equal(donor2.address);
  });

  it("Should reject handoff request from non-verifier", async function () {
    await expect(vault.connect(donor).requestVerifierHandoff(donor2.address))
      .to.be.revertedWithCustomError(vault, "OnlyVerifier");
  });

  it("Should reject handoff request with zero address", async function () {
    await expect(vault.connect(verifier).requestVerifierHandoff(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(vault, "ZeroAddress");
  });

  it("Should reject handoff acceptance before 2-day delay elapses", async function () {
    await vault.connect(verifier).requestVerifierHandoff(donor2.address);
    await expect(vault.connect(donor2).acceptVerifierHandoff())
      .to.be.revertedWithCustomError(vault, "HandoffTooEarly");
  });

  it("Should reject handoff acceptance from wrong address", async function () {
    await vault.connect(verifier).requestVerifierHandoff(donor2.address);
    await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine", []);
    await expect(vault.connect(donor).acceptVerifierHandoff())
      .to.be.revertedWithCustomError(vault, "OnlyVerifier");
  });

  it("Should complete handoff after 2-day delay and update verifier", async function () {
    await vault.connect(verifier).requestVerifierHandoff(donor2.address);
    await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine", []);
    await expect(vault.connect(donor2).acceptVerifierHandoff())
      .to.emit(vault, "VerifierUpdated")
      .withArgs(verifier.address, donor2.address);
    expect(await vault.verifier()).to.equal(donor2.address);
    expect(await vault.pendingVerifier()).to.equal(ethers.ZeroAddress);
  });

  it("Should reject acceptVerifierHandoff when no handoff is pending", async function () {
    await expect(vault.connect(donor2).acceptVerifierHandoff())
      .to.be.revertedWithCustomError(vault, "NoPendingHandoff");
  });

  // ─── Emergency Verifier Replace (NGO, post-expiry only) ───────────────

  it("Should allow NGO to replace verifier after EXPIRY_WINDOW", async function () {
    await ethers.provider.send("evm_increaseTime", [91 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);
    await expect(vault.connect(ngo).emergencyReplaceVerifier(donor2.address))
      .to.emit(vault, "VerifierUpdated")
      .withArgs(verifier.address, donor2.address);
    expect(await vault.verifier()).to.equal(donor2.address);
  });

  it("Should reject emergency replace before EXPIRY_WINDOW", async function () {
    await expect(vault.connect(ngo).emergencyReplaceVerifier(donor2.address))
      .to.be.revertedWithCustomError(vault, "NotExpired");
  });

  it("Should reject emergency replace from non-NGO address", async function () {
    await ethers.provider.send("evm_increaseTime", [91 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);
    await expect(vault.connect(donor).emergencyReplaceVerifier(donor2.address))
      .to.be.revertedWithCustomError(vault, "OnlyNgo");
  });

  it("Should reject emergency replace with zero address", async function () {
    await ethers.provider.send("evm_increaseTime", [91 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);
    await expect(vault.connect(ngo).emergencyReplaceVerifier(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(vault, "ZeroAddress");
  });
});