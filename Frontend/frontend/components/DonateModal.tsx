"use client";

import { useState, useEffect, useRef } from "react";

interface DonateModalProps {
  onDonate: (amount: string) => void;
  onClose: () => void;
  txPending: boolean;
  myContribution: string;
}

export function DonateModal({
  onDonate,
  onClose,
  txPending,
  myContribution,
}: DonateModalProps) {
  const [amount, setAmount] = useState("");
  // Fix #17 — track validation error message
  const [validationError, setValidationError] = useState<string | null>(null);

  const presets = ["0.001", "0.005", "0.01", "0.05"];
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Fix #13 — ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fix #13 — Focus trap: move focus to close button when modal opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Fix #17 — validate amount whenever it changes
  const validateAmount = (val: string): string | null => {
    if (!val || val.trim() === "") return "Please enter an amount.";
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return "Amount must be a number.";
    if (parsed <= 0) return "Amount must be greater than zero.";
    if (parsed < 0.0001) return "Minimum donation is 0.0001 tRBTC.";
    if (parsed > 100) return "Maximum single donation is 100 tRBTC.";
    // Guard against excessive decimal places that cause wei rounding issues
    const decimals = val.includes(".") ? val.split(".")[1].length : 0;
    if (decimals > 6) return "Maximum 6 decimal places allowed.";
    return null;
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    setValidationError(validateAmount(val));
  };

  const handlePreset = (p: string) => {
    setAmount(p);
    setValidationError(null); // presets are always valid
  };

  const handleSubmit = () => {
    const error = validateAmount(amount);
    if (error) {
      setValidationError(error);
      return;
    }
    // Round to 6 decimal places to avoid floating-point edge cases
    const rounded = (Math.round(parseFloat(amount) * 1e6) / 1e6).toString();
    onDonate(rounded);
  };

  const isInvalid = !!validationError || !amount;

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
              Your contribution:{" "}
              <strong>{parseFloat(myContribution).toFixed(4)} tRBTC</strong>
            </div>
          )}

          {/* Fix #13 — ARIA group + press state on presets */}
          <div className="presets" role="group" aria-label="Preset donation amounts">
            {presets.map((p) => (
              <button
                key={p}
                className={`preset-btn ${amount === p ? "active" : ""}`}
                onClick={() => handlePreset(p)}
                aria-label={`Donate ${p} tRBTC`}
                aria-pressed={amount === p}
              >
                {p} tRBTC
              </button>
            ))}
          </div>

          <div className="input-group">
            {/* Fix #13 — explicit label for screen readers */}
            <label htmlFor="donation-amount" className="sr-only">
              Custom donation amount in tRBTC
            </label>
            <input
              id="donation-amount"
              type="number"
              className="amount-input"
              placeholder="Custom amount"
              value={amount}
              // Fix #17 — validate on change
              onChange={(e) => handleAmountChange(e.target.value)}
              // Fix #17 — block minus / plus keys at the input level
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "+") e.preventDefault();
              }}
              min="0.0001"
              max="100"
              step="0.0001"
              aria-label="Custom donation amount"
              aria-describedby={validationError ? "donate-error" : undefined}
              aria-invalid={!!validationError}
            />
            <span className="input-suffix" aria-hidden="true">
              tRBTC
            </span>
          </div>

          {/* Fix #17 — show validation error inline */}
          {validationError && (
            <div
              id="donate-error"
              role="alert"
              style={{
                fontSize: "13px",
                color: "var(--red)",
                fontFamily: "var(--mono)",
                marginTop: "-4px",
              }}
            >
              ⚠ {validationError}
            </div>
          )}

          <div className="modal-note" role="note">
            Funds are held in escrow on Rootstock. Released only when
            milestones are verified.
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn-cancel"
            onClick={onClose}
            aria-label="Cancel donation"
          >
            Cancel
          </button>
          <button
            className="btn-donate-confirm"
            onClick={handleSubmit}
            disabled={txPending || isInvalid}
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