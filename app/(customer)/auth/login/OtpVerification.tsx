"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ClipboardEvent,
  type ChangeEvent,
} from "react";
import type { ConfirmationResult } from "firebase/auth";
import styles from "./login.module.css";

interface OtpVerificationProps {
  /** The phone number the OTP was sent to (for display only) */
  phoneNumber: string;
  /** The ConfirmationResult object returned by Firebase signInWithPhoneNumber */
  confirmationResult: ConfirmationResult;
  /** Called when OTP is verified and the user is signed in */
  onSuccess: () => void;
  /** Called when the user wants to go back and change their number */
  onBack: () => void;
  /** Called when "Resend OTP" is clicked — parent re-triggers sendOtp */
  onResend: () => Promise<void>;
}

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN_SEC = 30;

export default function OtpVerification({
  phoneNumber,
  confirmationResult,
  onSuccess,
  onBack,
  onResend,
}: OtpVerificationProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN_SEC);
  const [verified, setVerified] = useState(false);

  // One ref per OTP box
  const inputRefs = useRef<(HTMLInputElement | null)[]>(
    Array(OTP_LENGTH).fill(null)
  );

  // ── Countdown timer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  // ── Auto-submit when all 6 digits are filled ───────────────────────────────

  useEffect(() => {
    const code = digits.join("");
    if (code.length === OTP_LENGTH && !verifying && !verified) {
      verifyCode(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  // ── Focus first box on mount ───────────────────────────────────────────────

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Verify OTP with Firebase
  // ─────────────────────────────────────────────────────────────────────────

  const verifyCode = useCallback(
    async (code: string) => {
      setVerifying(true);
      setError("");

      try {
        await confirmationResult.confirm(code);
        setVerified(true);

        // Brief pause to show success state before navigating
        setTimeout(() => {
          onSuccess();
        }, 900);
      } catch (err: unknown) {
        const firebaseError = err as { code?: string };
        let message = "Invalid OTP. Please check and try again.";

        if (firebaseError.code === "auth/code-expired") {
          message = "OTP has expired. Please request a new one.";
        } else if (firebaseError.code === "auth/too-many-requests") {
          message = "Too many attempts. Please wait a moment and retry.";
        }

        setError(message);
        // Shake + clear boxes on error
        setDigits(Array(OTP_LENGTH).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } finally {
        setVerifying(false);
      }
    },
    [confirmationResult, onSuccess]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Input handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, ""); // digits only
    if (!raw) return;

    // Accept only the last typed character
    const char = raw.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError("");

    // Move focus forward
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];

      if (digits[index]) {
        // Clear current box
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        // Move back and clear previous
        next[index - 1] = "";
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
      setError("");
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    setError("");

    // Focus the next empty box, or last box if full
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Resend OTP
  // ─────────────────────────────────────────────────────────────────────────

  const handleResend = async () => {
    setResending(true);
    setError("");
    setDigits(Array(OTP_LENGTH).fill(""));

    try {
      await onResend();
      setCountdown(RESEND_COUNTDOWN_SEC);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const maskedPhone = (() => {
    const digitsOnly = phoneNumber.replace(/\D/g, "");
    if (digitsOnly.length >= 10) {
      const last2 = digitsOnly.slice(-2);
      const first4 = digitsOnly.slice(0, 4);
      return `${first4} ••••• ${last2}`;
    }
    return phoneNumber;
  })();

  if (verified) {
    return (
      <div className={styles.stepIn} style={{ textAlign: "center" }}>
        <div className={styles.successIcon}>✓</div>
        <h2 className={styles.heading} style={{ textAlign: "center" }}>
          Verified!
        </h2>
        <p className={styles.subheading} style={{ textAlign: "center" }}>
          Taking you in…
        </p>
      </div>
    );
  }

  const filledCount = digits.filter(Boolean).length;

  return (
    <div className={styles.stepIn}>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className={styles.backBtn}
        disabled={verifying}
        aria-label="Go back to phone number entry"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Change number
      </button>

      {/* Heading */}
      <h2 className={styles.heading}>Enter OTP</h2>
      <p className={styles.subheading}>
        6-digit code sent to{" "}
        <span>+91 {maskedPhone}</span>
      </p>

      {/* Error */}
      {error && (
        <div
          className={styles.error}
          role="alert"
          aria-live="assertive"
          id="otp-error"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* OTP Boxes */}
      <div
        className={styles.otpGrid}
        role="group"
        aria-label="One-time password input"
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            id={`otp-box-${index}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
            aria-describedby={error ? "otp-error" : undefined}
            disabled={verifying}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={[
              styles.otpBox,
              digit ? styles.otpFilled : "",
              error ? styles.otpError : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        ))}
      </div>

      {/* Verify Button */}
      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          id="verify-otp-btn"
          className={styles.btn}
          disabled={filledCount < OTP_LENGTH || verifying}
          onClick={() => verifyCode(digits.join(""))}
          aria-busy={verifying}
        >
          {verifying ? (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              Verifying…
            </>
          ) : (
            "Verify & Sign In"
          )}
        </button>
      </div>

      {/* Resend row */}
      <div className={styles.timerRow} aria-live="polite">
        {countdown > 0 ? (
          <>
            Resend OTP in{" "}
            <span className={styles.timerValue} aria-label={`${countdown} seconds`}>
              {String(countdown).padStart(2, "0")}s
            </span>
          </>
        ) : (
          <>
            Didn&apos;t receive it?{" "}
            <button
              type="button"
              id="resend-otp-btn"
              className={styles.resendBtn}
              onClick={handleResend}
              disabled={resending}
              aria-busy={resending}
            >
              {resending ? "Sending…" : "Resend OTP"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
