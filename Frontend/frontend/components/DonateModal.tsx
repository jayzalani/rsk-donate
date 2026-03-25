"use client";

import { useState } from "react";

interface DonateModalProps {
  onDonate: (amount: string) => void;
  onClose: () => void;
  txPending: boolean;
  myContribution: string;
}

export function DonateModal({ onDonate, onClose, txPending, myContribution }: DonateModalProps) {
  const [amount, setAmount] = useState("");
  const presets = ["0.001", "0.005", "0.01", "0.05"];

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    onDonate(amount);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Donate tRBTC</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {parseFloat(myContribution) > 0 && (
            <div className="my-contribution">
              Your contribution: <strong>{parseFloat(myContribution).toFixed(4)} tRBTC</strong>
            </div>
          )}

          <div className="presets">
            {presets.map((p) => (
              <button
                key={p}
                className={`preset-btn ${amount === p ? "active" : ""}`}
                onClick={() => setAmount(p)}
              >
                {p} tRBTC
              </button>
            ))}
          </div>

          <div className="input-group">
            <input
              type="number"
              className="amount-input"
              placeholder="Custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.001"
            />
            <span className="input-suffix">tRBTC</span>
          </div>

          <div className="modal-note">
            Funds are held in escrow on Rootstock. Released only when milestones are verified.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="btn-donate-confirm"
            onClick={handleSubmit}
            disabled={txPending || !amount || parseFloat(amount) <= 0}
          >
            {txPending ? "Confirming…" : "Donate →"}
          </button>
        </div>
      </div>
    </div>
  );
}