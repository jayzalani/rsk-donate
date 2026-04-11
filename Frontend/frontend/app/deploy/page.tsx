"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useContract } from "@/hooks/useContract";
import { useFactory } from "@/hooks/useFactory";
import Link from "next/link";

interface MilestoneRow {
  amount: string;
  description: string;
}

export default function DeployPage() {
  const { account, connectWallet } = useContract();
  const { deploying, error, lastDeployedVault, deployVault } = useFactory(account);

  const [ngo, setNgo]               = useState("");
  const [verifier, setVerifier]     = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget]         = useState("");
  const [milestones, setMilestones] = useState<MilestoneRow[]>([
    { amount: "", description: "" },
    { amount: "", description: "" },
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-fill verifier with connected wallet
  useEffect(() => {
    if (account && !verifier) setVerifier(account);
  }, [account, verifier]);

  const addMilestone = () =>
    setMilestones((prev) => [...prev, { amount: "", description: "" }]);

  const removeMilestone = (i: number) =>
    setMilestones((prev) => prev.filter((_, idx) => idx !== i));

  const updateMilestone = (i: number, field: keyof MilestoneRow, val: string) =>
    setMilestones((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [field]: val } : m))
    );

  const validate = (): string | null => {
    if (!ngo.startsWith("0x") || ngo.length !== 42)
      return "NGO address is not a valid Ethereum address.";
    if (!verifier.startsWith("0x") || verifier.length !== 42)
      return "Verifier address is not a valid Ethereum address.";
    if (!description.trim()) return "Campaign description is required.";
    const t = parseFloat(target);
    if (isNaN(t) || t <= 0) return "Target amount must be greater than zero.";
    if (milestones.length === 0) return "Add at least one milestone.";
    for (let i = 0; i < milestones.length; i++) {
      const a = parseFloat(milestones[i].amount);
      if (isNaN(a) || a <= 0)
        return `Milestone ${i + 1} amount must be greater than zero.`;
      if (!milestones[i].description.trim())
        return `Milestone ${i + 1} description is required.`;
    }
    const sum = milestones.reduce((acc, m) => acc + parseFloat(m.amount || "0"), 0);
    // Allow small floating point rounding tolerance
    if (Math.abs(sum - t) > 0.000001)
      return `Milestone amounts (${sum} tRBTC) must sum exactly to target (${t} tRBTC).`;
    return null;
  };

  const handleDeploy = async () => {
    const err = validate();
    if (err) { setValidationError(err); return; }
    setValidationError(null);

    await deployVault({
      ngo,
      verifier,
      description,
      targetEth: target,
      milestoneAmounts: milestones.map((m) => m.amount),
      milestoneDescriptions: milestones.map((m) => m.description),
    });
  };

  const milestoneSum = milestones
    .reduce((acc, m) => acc + parseFloat(m.amount || "0"), 0)
    .toFixed(6);

  return (
    <>
      <Header account={account} onConnect={connectWallet} />

      <main className="main">
        <section className="hero">
          <div className="hero-tag">Factory Registry</div>
          <h1 className="hero-title">
            Deploy a <span className="hero-accent">New Vault</span>
          </h1>
          <p className="hero-sub">
            Create a new milestone-based donation vault through the on-chain
            factory. Every vault is publicly tracked in the registry.
          </p>
        </section>

        {/* Success banner */}
        {lastDeployedVault && (
          <div
            className="error-banner"
            style={{
              borderColor: "var(--green)",
              color: "var(--green)",
              background: "var(--green-dim)",
              marginBottom: "24px",
            }}
          >
            ✓ Vault deployed at{" "}
            <a
              href={`https://explorer.testnet.rsk.co/address/${lastDeployedVault}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)", textDecoration: "underline" }}
            >
              {lastDeployedVault} ↗
            </a>
            <br />
            <span style={{ fontSize: "13px", marginTop: "6px", display: "block" }}>
              Copy this address and set it as{" "}
              <code style={{ fontFamily: "var(--mono)" }}>
                NEXT_PUBLIC_CONTRACT_ADDRESS
              </code>{" "}
              in your <code style={{ fontFamily: "var(--mono)" }}>.env.local</code>
            </span>
          </div>
        )}

        {/* Validation / tx error */}
        {(validationError || error) && (
          <div className="error-banner" style={{ marginBottom: "24px" }}>
            ⚠ {validationError ?? error}
          </div>
        )}

        {!account ? (
          <div className="stats-section">
            <p style={{ color: "var(--text2)", marginBottom: "16px" }}>
              Connect your wallet to deploy a vault.
            </p>
            <button className="btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="stats-section">

            {/* ── Addresses ── */}
            <h2 className="section-title" style={{ marginBottom: "20px" }}>
              <span className="section-icon">◈</span> Addresses
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "28px" }}>
              <div>
                <label htmlFor="ngo-addr" className="deploy-label">NGO Address</label>
                <input
                  id="ngo-addr"
                  className="amount-input"
                  style={{ width: "100%", paddingRight: "16px" }}
                  placeholder="0x..."
                  value={ngo}
                  onChange={(e) => setNgo(e.target.value)}
                  aria-label="NGO wallet address"
                />
                <p className="deploy-hint">Wallet that receives released milestone funds.</p>
              </div>

              <div>
                <label htmlFor="verifier-addr" className="deploy-label">Verifier Address</label>
                <input
                  id="verifier-addr"
                  className="amount-input"
                  style={{ width: "100%", paddingRight: "16px" }}
                  placeholder="0x..."
                  value={verifier}
                  onChange={(e) => setVerifier(e.target.value)}
                  aria-label="Verifier wallet address"
                />
                <p className="deploy-hint">Wallet authorised to release milestones. Pre-filled with your connected wallet.</p>
              </div>
            </div>

            {/* ── Campaign ── */}
            <h2 className="section-title" style={{ marginBottom: "20px" }}>
              <span className="section-icon">◎</span> Campaign
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "28px" }}>
              <div>
                <label htmlFor="campaign-desc" className="deploy-label">Description</label>
                <textarea
                  id="campaign-desc"
                  className="amount-input"
                  style={{
                    width: "100%",
                    paddingRight: "16px",
                    minHeight: "80px",
                    resize: "vertical",
                    fontFamily: "var(--font)",
                    lineHeight: "1.6",
                  }}
                  placeholder="What is this campaign raising funds for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  aria-label="Campaign description"
                />
              </div>

              <div>
                <label htmlFor="target-amount" className="deploy-label">
                  Target Amount (tRBTC)
                </label>
                <div className="input-group">
                  <input
                    id="target-amount"
                    type="number"
                    className="amount-input"
                    placeholder="0.01"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    min="0"
                    step="0.001"
                    aria-label="Fundraising target in tRBTC"
                  />
                  <span className="input-suffix" aria-hidden="true">tRBTC</span>
                </div>
              </div>
            </div>

            {/* ── Milestones ── */}
            <h2 className="section-title" style={{ marginBottom: "8px" }}>
              <span className="section-icon">◎</span> Milestones
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text3)", marginBottom: "20px", fontFamily: "var(--mono)" }}>
              Sum: {milestoneSum} tRBTC
              {target && Math.abs(parseFloat(milestoneSum) - parseFloat(target || "0")) < 0.000001
                ? " ✓ matches target"
                : target ? ` — must equal ${target} tRBTC` : ""}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {milestones.map((m, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--bg3)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    padding: "16px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                      <label className="deploy-label">Milestone {i + 1} Description</label>
                      <input
                        className="amount-input"
                        style={{ width: "100%", paddingRight: "16px" }}
                        placeholder={`e.g. Phase ${i + 1} completion`}
                        value={m.description}
                        onChange={(e) => updateMilestone(i, "description", e.target.value)}
                        aria-label={`Milestone ${i + 1} description`}
                      />
                    </div>
                    <div>
                      <label className="deploy-label">Amount (tRBTC)</label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="amount-input"
                          placeholder="0.005"
                          value={m.amount}
                          onChange={(e) => updateMilestone(i, "amount", e.target.value)}
                          min="0"
                          step="0.001"
                          aria-label={`Milestone ${i + 1} amount`}
                        />
                        <span className="input-suffix" aria-hidden="true">tRBTC</span>
                      </div>
                    </div>
                  </div>

                  {milestones.length > 1 && (
                    <button
                      onClick={() => removeMilestone(i)}
                      style={{
                        background: "none",
                        border: "1px solid var(--red)",
                        color: "var(--red)",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        cursor: "pointer",
                        fontSize: "13px",
                        flexShrink: 0,
                        marginTop: "22px",
                      }}
                      aria-label={`Remove milestone ${i + 1}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addMilestone}
              style={{
                background: "transparent",
                border: "1px dashed var(--border2)",
                color: "var(--text2)",
                padding: "10px 20px",
                borderRadius: "var(--radius)",
                cursor: "pointer",
                fontSize: "14px",
                width: "100%",
                marginBottom: "28px",
                fontFamily: "var(--font)",
              }}
            >
              + Add Milestone
            </button>

            {/* ── Deploy button ── */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                className="btn-primary"
                onClick={handleDeploy}
                disabled={deploying}
                aria-busy={deploying}
                style={{ flex: 2 }}
              >
                {deploying ? "Deploying…" : "Deploy Vault →"}
              </button>
              <Link href="/" style={{ flex: 1 }}>
                <button
                  className="btn-cancel"
                  style={{ width: "100%" }}
                >
                  ← Back to Dashboard
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* ── How factory works ── */}
        <section className="proof-section" style={{ marginTop: "32px" }}>
          <h2 className="section-title">
            <span className="section-icon">⬡</span> How the factory works
          </h2>
          <div className="how-grid">
            <div className="how-card">
              <div className="how-num">01</div>
              <div className="how-title">Fill the form</div>
              <div className="how-desc">
                Set the NGO wallet, a trusted verifier, your fundraising
                target, and define each milestone with an amount and description.
              </div>
            </div>
            <div className="how-card">
              <div className="how-num">02</div>
              <div className="how-title">Deploy on-chain</div>
              <div className="how-desc">
                The factory contract deploys a new DonationVault and registers
                its address in the on-chain registry — permanently trackable.
              </div>
            </div>
            <div className="how-card">
              <div className="how-num">03</div>
              <div className="how-title">Share the address</div>
              <div className="how-desc">
                Copy the deployed vault address and set it as your
                NEXT_PUBLIC_CONTRACT_ADDRESS to point the dashboard at it.
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}