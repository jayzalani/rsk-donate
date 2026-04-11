"use client";

import Link from "next/link";

interface HeaderProps {
  account: string | null;
  onConnect: () => void;
}

export function Header({ account, onConnect }: HeaderProps) {
  const short = account ? `${account.slice(0, 6)}…${account.slice(-4)}` : null;

  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <span className="logo-icon">◈</span>
          <div>
            <span className="logo-title">RSK Donate</span>
            <span className="logo-sub">Rootstock · Bitcoin-secured</span>
          </div>
        </div>

        <div className="header-right">
          {/* Nav links */}
          <Link
            href="/"
            className="explorer-link"
            style={{ textDecoration: "none" }}
          >
            Dashboard
          </Link>
          <Link
            href="/vaults"
            className="explorer-link"
            style={{ textDecoration: "none" }}
          >
            All Vaults
          </Link>
          <Link
            href="/deploy"
            className="explorer-link"
            style={{ textDecoration: "none" }}
          >
            Deploy
          </Link>

          <a
            href={`https://explorer.testnet.rsk.co/address/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="explorer-link"
          >
            Explorer ↗
          </a>

          {account ? (
            <div className="wallet-badge">
              <span className="wallet-dot" />
              {short}
            </div>
          ) : (
            <button className="btn-connect" onClick={onConnect}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}