import { useState } from "react";
import { apiRequest } from "../api";
import "./Authpages.css";

function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const data = await apiRequest("/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setMessage(
        data.message ||
          "If the account exists, reset instructions will be provided.",
      );
    } catch (err) {
      setError(err.message || "Unable to process your request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <section className="auth-card">
        <div className="auth-brand">
          <span>
            Expense<span className="auth-brand-accent">Flow</span>
          </span>
        </div>
        <div className="auth-heading">
          <p className="auth-eyebrow">ACCOUNT RECOVERY</p>
          <h1>Forgot your password?</h1>
          <p className="auth-description">
            It happens. Enter your email address and we'll help you get back
            into your account.
          </p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="forgot-email">Email address</label>
            <input
              id="forgot-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {message && (
            <div className="auth-notice auth-success" role="status">
              {message}
            </div>
          )}

          {error && (
            <div className="auth-notice auth-error" role="alert">
              {error}
            </div>
          )}

          <button
            className="auth-primary-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Sending instructions..." : "Send reset link"}
            {!loading && <span aria-hidden="true">→</span>}
          </button>
        </form>
        <button type="button" className="auth-back-button" onClick={onBack}>
          <span aria-hidden="true">←</span> Back to sign in
        </button>
        <div className="auth-security">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          Your account security matters.
        </div>
      </section>

      <p className="auth-footer">
        Spend wisely. Save consistently. <span>Build your future.</span>
      </p>
    </main>
  );
}

export default ForgotPassword;
