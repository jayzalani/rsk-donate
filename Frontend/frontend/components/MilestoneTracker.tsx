"use client";

import { Milestone } from "@/lib/type";

interface MilestoneTrackerProps {
  milestones: Milestone[];
  isVerifier: boolean;
  txPending: boolean;
  formatEther: (val: bigint) => string;
  onRelease: (index: number) => void;
}

export function MilestoneTracker({
  milestones,
  isVerifier,
  txPending,
  formatEther,
  onRelease,
}: MilestoneTrackerProps) {
  return (
    <div className="milestones-section">
      <h2 className="section-title">
        <span className="section-icon">◎</span> Milestones
        {isVerifier && <span className="verifier-badge">Verifier</span>}
      </h2>
      <div className="milestones-list">
        {milestones.map((m, i) => (
          <div key={i} className={`milestone-item ${m.released ? "released" : "pending"}`}>
            <div className="milestone-left">
              <div className={`milestone-dot ${m.released ? "dot-done" : "dot-pending"}`}>
                {m.released ? "✓" : i + 1}
              </div>
              <div className="milestone-connector" />
            </div>
            <div className="milestone-body">
              <div className="milestone-header">
                <span className="milestone-desc">{m.description}</span>
                <span className={`milestone-status ${m.released ? "status-done" : "status-pending"}`}>
                  {m.released ? "Released" : "Locked"}
                </span>
              </div>
              <div className="milestone-footer">
                <span className="milestone-amount">
                  {parseFloat(formatEther(m.amount)).toFixed(4)} tRBTC
                </span>
                {isVerifier && !m.released && (
                  <button
                    className="btn-release"
                    onClick={() => onRelease(i)}
                    disabled={txPending}
                  >
                    {txPending ? "Releasing…" : "Release funds →"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}