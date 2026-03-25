"use client";

import { CampaignData } from "@/lib/type";

interface StatsBarProps {
  data: CampaignData;
  formatEther: (val: bigint) => string;
}

export function StatsBar({ data, formatEther }: StatsBarProps) {
  const raised = parseFloat(formatEther(data.totalRaised));
  const target = parseFloat(formatEther(data.targetAmount));
  const pct = target > 0 ? Math.min((raised / target) * 100, 100) : 0;
  const released = data.milestones.filter((m) => m.released).length;
  const lastUpdate = new Date(Number(data.lastUpdateTimestamp) * 1000);
  const daysSince = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, 90 - daysSince);

  return (
    <div className="stats-section">
      <div className="campaign-desc">{data.description}</div>

      <div className="progress-wrap">
        <div className="progress-header">
          <span className="progress-label">Funding progress</span>
          <span className="progress-pct">{pct.toFixed(1)}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="progress-amounts">
          <span>{raised.toFixed(4)} tRBTC raised</span>
          <span>Target: {target.toFixed(4)} tRBTC</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{raised.toFixed(4)}</span>
          <span className="stat-label">tRBTC raised</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{released}/{data.milestones.length}</span>
          <span className="stat-label">Milestones complete</span>
        </div>
        <div className="stat-card">
          <span className={`stat-value ${daysLeft < 10 ? "warn" : ""}`}>{daysLeft}d</span>
          <span className="stat-label">Until refund window</span>
        </div>
        <div className="stat-card">
          <span className="stat-value mono">{data.ngo.slice(0, 6)}…{data.ngo.slice(-4)}</span>
          <span className="stat-label">NGO address</span>
        </div>
      </div>
    </div>
  );
}