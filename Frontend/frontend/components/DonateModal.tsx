"use client";

import { useState, useEffect, useRef } from "react";

interface DonateModalProps {
  onDonate: (amount: string) => void;
  onClose: () => void;
  txPending: boolean;
  myContribution: string;
}

export function DonateModal({ onDonate, onClose, txPending, myContribution }: DonateModalProps) {
  const [amount, setAmount] = useState("");
  const presets = ["0.001", "0.005", "0.01", "0.05"];
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Fix #13 - ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fix #13 - Focus trap inside modal
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    onDonate(amount);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="modal"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="modal-title">Donate tRBTC</h3>
          <button
            className="modal-close"
            onClick={onClose}
            ref={closeButtonRef}
            aria-label="Close donation modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {parseFloat(myContribution) > 0 && (
            <div className="my-contribution" aria-live="polite">
              Your contribution: <strong>{parseFloat(myContribution).toFixed(4)} tRBTC</strong>
            </div>
          )}

          <div className="presets" role="group" aria-label="Preset donation amounts">
            {presets.map((p) => (
              <button
                key={p}
                className={`preset-btn ${amount === p ? "active" : ""}`}
                onClick={() => setAmount(p)}
                aria-label={`Donate ${p} tRBTC`}
                aria-pressed={amount === p}
              >
                {p} tRBTC
              </button>
            ))}
          </div>

          <div className="input-group">
            <label htmlFor="donation-amount" className="sr-only">
              Custom donation amount in tRBTC
            </label>
            <input
              id="donation-amount"
              type="number"
              className="amount-input"
              placeholder="Custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.001"
              step="0.001"
              aria-label="Custom donation amount"
            />
            <span className="input-suffix" aria-hidden="true">tRBTC</span>
          </div>

          <div className="modal-note" role="note">
            Funds are held in escrow on Rootstock. Released only when milestones are verified.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} aria-label="Cancel donation">
            Cancel
          </button>
          <button
            className="btn-donate-confirm"
            onClick={handleSubmit}
            disabled={txPending || !amount || parseFloat(amount) <= 0}
            aria-busy={txPending}
            aria-label={txPending ? "Confirming donation" : "Confirm donation"}
          >
            {txPending ? "Confirming…" : "Donate →"}
          </button>
        </div>
      </div>
    </div>
  );
}