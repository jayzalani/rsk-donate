"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useContract } from "@/hooks/useContract";
import { useFactory } from "@/hooks/useFactory";

export default function VaultsPage() {
  const { account, connectWallet } = useContract();
  const { vaults, loading, error, fetchVaults } = useFactory(account);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  return (
    <>
      <Header account={account} onConnect={connectWallet} />

      <main className="main">
        <section className="hero">
          <div className="hero-tag">On-Chain Registry</div>
          <h1 className="hero-title">
            All <span className="hero-accent">Vaults</span>
          </h1>
          <p className="hero-sub">
            Every DonationVault deployed through the factory is listed here.
            All data is read directly from the Rootstock blockchain.
          </p>
          <div className="hero-actions">
            <Link href="/deploy">
              <button className="btn-primary">Deploy New Vault →</button>
            </Link>
            <Link href="/">
              <button className="btn-refund" style={{ borderColor: "var(--text3)", color: "var(--text2)" }}>
                ← Dashboard
              </button>
            </Link>
          </div>
        </section>

        {error && (
          <div className="error-banner">⚠ {error}</div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <span>Reading registry from Rootstock…</span>
          </div>
        )}

        {!loading && vaults.length === 0 && !error && (
          <div className="stats-section">
            <p style={{ color: "var(--text2)", textAlign: "center", padding: "24px 0" }}>
              No vaults deployed through the factory yet.{" "}
              <Link href="/deploy" style={{ color: "var(--accent)" }}>
                Deploy the first one →
              </Link>
            </p>
          </div>
        )}

        {!loading && vaults.length > 0 && (
          <div className="milestones-section">
            <h2 className="section-title">
              <span className="section-icon">◈</span> Registry
              <span
                style={{
                  fontSize: "12px",
                  fontFamily: "var(--mono)",
                  color: "var(--text3)",
                  fontWeight: 400,
                  marginLeft: "8px",
                }}
              >
                {vaults.length} vault{vaults.length !== 1 ? "s" : ""}
              </span>
            </h2>

            <div className="address-list">
              {vaults.map((v, i) => (
                <div key={v.address} className="address-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "8px", padding: "18px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                    <span
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        color: "var(--accent)",
                        background: "var(--bg3)",
                        border: "1px solid var(--border)",
                        borderRadius: "100px",
                        padding: "2px 10px",
                        flexShrink: 0,
                      }}
                    >
                      #{i + 1}
                    </span>
                    <a
                      href={`https://explorer.testnet.rsk.co/address/${v.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="address-value mono"
                      style={{ fontSize: "14px" }}
                    >
                      {v.address} ↗
                    </a>
                  </div>
                  <div style={{ display: "flex", gap: "24px", paddingLeft: "2px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "var(--text3)", fontFamily: "var(--mono)" }}>
                      NGO: {v.ngo.slice(0, 6)}…{v.ngo.slice(-4)}
                    </span>
                    <Link
                      href={`/?vault=${v.address}`}
                      style={{ fontSize: "12px", color: "var(--accent)", fontFamily: "var(--mono)", textDecoration: "none" }}
                    >
                      View dashboard →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}