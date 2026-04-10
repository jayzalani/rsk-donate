"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { StatsBar } from "@/components/StatsBar";
import { MilestoneTracker } from "@/components/MilestoneTracker";
import { DonateModal } from "@/components/DonateModal";
import { useContract } from "@/hooks/useContract";

export default function Home() {
  const {
    account,
    campaignData,
    loading,
    txPending,
    error,
    lastTxHash, // Fix #16 — consume tx hash from hook
    isVerifier,
    isExpired,
    connectWallet,
    donate,
    releaseMilestone,
    claimRefund,
    formatEther,
  } = useContract();

  const [showDonate, setShowDonate] = useState(false);

  const handleDonate = async (amount: string) => {
    await donate(amount);
    setShowDonate(false);
  };

  return (
    <>
      <Header account={account} onConnect={connectWallet} />

      <main className="main">
        {/* Hero */}
        <section className="hero">
          <div className="hero-tag">Bitcoin-Secured Philanthropy</div>
          <h1 className="hero-title">
            Transparent Impact<br />
            <span className="hero-accent">On-Chain</span>
          </h1>
          <p className="hero-sub">
            Every donation is tracked on Rootstock. Funds release only when
            verified milestones are complete — or donors reclaim them after
            90 days of inactivity.
          </p>
          <div className="hero-actions">
            {account ? (
              <button
                className="btn-primary"
                onClick={() => setShowDonate(true)}
              >
                Donate tRBTC
              </button>
            ) : (
              <button className="btn-primary" onClick={connectWallet}>
                Connect Wallet to Donate
              </button>
            )}
            {account &&
              isExpired &&
              campaignData &&
              Number(campaignData.myContribution) > 0 && (
                <button
                  className="btn-refund"
                  onClick={claimRefund}
                  disabled={txPending}
                >
                  {txPending ? "Processing…" : "Claim Refund"}
                </button>
              )}
          </div>
        </section>

        {/* Error banner */}
        {error && (
          <div className="error-banner">
            <span>⚠ {error}</span>
          </div>
        )}

        {/* Fix #16 — Transaction confirmed banner with RSK Explorer link */}
        {lastTxHash && !txPending && (
          <div
            className="error-banner"
            style={{
              borderColor: "var(--green)",
              color: "var(--green)",
              background: "var(--green-dim)",
            }}
          >
            ✓ Transaction confirmed —{" "}
            <a
              href={`https://explorer.testnet.rsk.co/tx/${lastTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)", textDecoration: "underline" }}
            >
              View on RSK Explorer ↗
            </a>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <span>Reading from Rootstock…</span>
          </div>
        )}

        {/* Campaign data */}
        {!loading && campaignData && (
          <>
            <StatsBar data={campaignData} formatEther={formatEther} />
            <MilestoneTracker
              milestones={campaignData.milestones}
              isVerifier={isVerifier}
              txPending={txPending}
              formatEther={formatEther}
              onRelease={releaseMilestone}
            />
          </>
        )}

        {/* How it works */}
        <section className="proof-section">
          <h2 className="section-title">
            <span className="section-icon">⬡</span> How it works
          </h2>
          <div className="how-grid">
            <div className="how-card">
              <div className="how-num">01</div>
              <div className="how-title">Donate</div>
              <div className="how-desc">
                Send tRBTC directly to the smart contract. Your contribution
                is tracked on-chain, forever.
              </div>
            </div>
            <div className="how-card">
              <div className="how-num">02</div>
              <div className="how-title">Milestone verified</div>
              <div className="how-desc">
                The designated verifier confirms real-world progress and
                triggers fund release to the NGO.
              </div>
            </div>
            <div className="how-card">
              <div className="how-num">03</div>
              <div className="how-title">90-day safeguard</div>
              <div className="how-desc">
                No activity for 90 days? Donors can claim a full refund —
                no questions, no permission needed.
              </div>
            </div>
          </div>
        </section>

        {/* Contract addresses */}
        {campaignData && (
          <section className="addresses-section">
            <h2 className="section-title">
              <span className="section-icon">◈</span> On-chain addresses
            </h2>
            <div className="address-list">
              <AddressRow
                label="Contract"
                address={process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!}
              />
              <AddressRow label="NGO" address={campaignData.ngo} />
              <AddressRow label="Verifier" address={campaignData.verifier} />
            </div>
          </section>
        )}
      </main>

      {showDonate && campaignData && (
        <DonateModal
          onDonate={handleDonate}
          onClose={() => setShowDonate(false)}
          txPending={txPending}
          myContribution={formatEther(campaignData.myContribution)}
        />
      )}
    </>
  );
}

function AddressRow({ label, address }: { label: string; address: string }) {
  return (
    <div className="address-row">
      <span className="address-label">{label}</span>
      <a
        href={`https://explorer.testnet.rsk.co/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="address-value mono"
      >
        {address} ↗
      </a>
    </div>
  );
}