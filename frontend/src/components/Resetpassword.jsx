
import React, { useState } from "react";
import { apiRequest } from "../api";
import "./AuthPages.css";

function ResetPassword({ token, onBack }) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!token) {
            setError("Your reset link is missing its token. Request a new link.");
            return;
        }

        if (
    newPassword.length < 8 ||
    newPassword.length > 72 ||
    !/[a-z]/.test(newPassword) ||
    !/[A-Z]/.test(newPassword) ||
    !/[0-9]/.test(newPassword) ||
    !/[^A-Za-z0-9]/.test(newPassword)
) {
    setError(
        "Password must be 8–72 characters and include uppercase, lowercase, a number, and a special character."
    );
    return;
}

if (newPassword !== confirmPassword) {
    setError("Your passwords do not match.");
    return;
}

        setLoading(true);

        try {
            const data = await apiRequest("/reset-password", {
                method: "POST",
                body: JSON.stringify({ token, newPassword }),
            });

            setMessage(
                data.message || "Password reset successful. Please log in again."
            );
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setError(err.message || "Unable to reset your password.");
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
                    <div className="auth-brand-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="5" width="18" height="15" rx="3" />
                            <path d="M16 14h5M3 9h18M7 3v4" />
                        </svg>
                    </div>
                    <span>Expense<span className="auth-brand-accent">Flow</span></span>
                </div>

                <div className="auth-heading">
                    <div className="auth-symbol" aria-hidden="true">✓</div>
                    <p className="auth-eyebrow">SECURE YOUR ACCOUNT</p>
                    <h1>Set a new password.</h1>
                    <p className="auth-description">
                        Choose a strong password you haven't used before.
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label htmlFor="new-password">New password</label>
                        <input
                            id="new-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your new password"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="confirm-password">Confirm password</label>
                        <input
                            id="confirm-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter it again"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <label className="auth-show-password">
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={(e) => setShowPassword(e.target.checked)}
                        />
                        Show passwords
                    </label>

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
                        {loading ? "Updating password..." : "Reset password"}
                        {!loading && <span aria-hidden="true">→</span>}
                    </button>
                </form>

                <button
                    type="button"
                    className="auth-back-button"
                    onClick={onBack}
                >
                    <span aria-hidden="true">←</span> Back to sign in
                </button>

                <div className="auth-security">
                    <span aria-hidden="true">♧</span>
                    Your account security matters.
                </div>
            </section>

            <p className="auth-footer">
                Spend wisely. Save consistently. <span>Build your future.</span>
            </p>
        </main>
    );
}

export default ResetPassword;
