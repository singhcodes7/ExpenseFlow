
import React, { useState } from "react";
import { apiRequest } from "../../api";
import "../Login.css";

function Register({ onBackToLogin }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [otpStep, setOtpStep] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setMessage("");
        setLoading(true);

        try {
            if (!otpStep) {
                if (password !== confirmPassword) {
                    setError("Passwords do not match.");
                    return;
                }

                if (
                    password.length < 8 ||
                    password.length > 72 ||
                    !/[a-z]/.test(password) ||
                    !/[A-Z]/.test(password) ||
                    !/[0-9]/.test(password) ||
                    !/[^A-Za-z0-9]/.test(password)
                ) {
                    setError(
                        "Password must be 8–72 characters and include uppercase, lowercase, a number, and a special character."
                    );
                    return;
                }

                const data = await apiRequest("/register", {
                    method: "POST",
                    body: JSON.stringify({
                        name: name.trim(),
                        email: email.trim().toLowerCase(),
                        password,
                    }),
                });

                setOtpStep(true);
                setMessage(
                    data.message ||
                    "A six-digit verification code has been sent to your email."
                );
            } else {
                const data = await apiRequest("/verify-registration-otp", {
                    method: "POST",
                    body: JSON.stringify({
                        email: email.trim().toLowerCase(),
                        otp,
                    }),
                });

                setSuccess(
                    data.message ||
                    "Email verified successfully. You can now sign in."
                );
                setPassword("");
                setConfirmPassword("");
                setOtp("");
            }
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const data = await apiRequest("/resend-registration-otp", {
                method: "POST",
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                }),
            });

            setMessage(data.message || "If the account needs verification, a new OTP will be sent.");
        } catch (err) {
            setError(err.message || "Unable to resend OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            <div className="login-glow login-glow-one"></div>
            <div className="login-glow login-glow-two"></div>

            <section className="login-card">
                <div className="login-brand">
                    <div className="login-brand-icon">
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <rect x="3" y="5" width="18" height="15" rx="3" />
                            <path d="M16 14h5" />
                            <path d="M3 9h18" />
                            <path d="M7 3v4" />
                        </svg>
                    </div>
                    <span>
                        Expense<span className="brand-accent">Flow</span>
                    </span>
                </div>

                <div className="login-heading">
                    <p className="login-eyebrow">
                        {success
                            ? "EMAIL VERIFIED"
                            : otpStep
                                ? "EMAIL VERIFICATION"
                                : "GET STARTED"}
                    </p>
                    <h1>
                        {success
                            ? "You're all set."
                            : otpStep
                                ? "Check your email."
                                : "Create your account."}
                    </h1>
                    <p className="login-subtitle">
                        {success
                            ? "Your account is ready. Sign in to continue."
                            : otpStep
                                ? `Enter the six-digit verification code sent to ${email}.`
                                : "Take control of your money, one expense at a time."}
                    </p>
                </div>

                {success ? (
                    <div>
                        <div className="login-security" role="status">
                            {success}
                        </div>
                        <button
                            type="button"
                            className="login-submit"
                            onClick={onBackToLogin}
                        >
                            Back to sign in <span aria-hidden="true">→</span>
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="login-form">
                        {!otpStep ? (
                            <>
                                <div className="login-field">
                                    <label htmlFor="register-name">Full name</label>
                                    <input
                                        id="register-name"
                                        type="text"
                                        placeholder="Your name"
                                        autoComplete="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        maxLength={100}
                                        required
                                    />
                                </div>

                                <div className="login-field">
                                    <label htmlFor="register-email">Email address</label>
                                    <input
                                        id="register-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="login-field">
                                    <label htmlFor="register-password">Password</label>
                                    <div className="password-input-wrap">
                                        <input
                                            id="register-password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create a strong password"
                                            autoComplete="new-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            maxLength={72}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            aria-label={
                                                showPassword ? "Hide password" : "Show password"
                                            }
                                        >
                                            {showPassword ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                    <p className="login-subtitle">
                                        Use 8–72 characters with uppercase, lowercase,
                                        a number, and a special character.
                                    </p>
                                </div>

                                <div className="login-field">
                                    <label htmlFor="register-confirm-password">
                                        Confirm password
                                    </label>
                                    <input
                                        id="register-confirm-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password again"
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        maxLength={72}
                                        required
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="login-field">
                                <label htmlFor="register-otp">Six-digit verification code</label>
                                <input
                                    id="register-otp"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(e) =>
                                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                                    }
                                    pattern="[0-9]{6}"
                                    maxLength={6}
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="forgot-link"
                                    onClick={handleResendOtp}
                                    disabled={loading}
                                >
                                    Resend code
                                </button>
                            </div>
                        )}

                        {message && (
                            <div className="login-security" role="status">
                                {message}
                            </div>
                        )}

                        {error && (
                            <div className="login-error" role="alert">
                                <span aria-hidden="true">!</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="login-submit"
                            disabled={loading || (otpStep && otp.length !== 6)}
                        >
                            {loading
                                ? otpStep
                                    ? "Verifying..."
                                    : "Creating account..."
                                : otpStep
                                    ? "Verify email"
                                    : "Create account"}
                            {!loading && <span aria-hidden="true">→</span>}
                        </button>

                        {otpStep && (
                            <button
                                type="button"
                                className="forgot-link"
                                onClick={() => {
                                    setOtpStep(false);
                                    setOtp("");
                                    setError("");
                                    setMessage("");
                                }}
                                disabled={loading}
                            >
                                Back to registration
                            </button>
                        )}
                    </form>
                )}

                <div className="login-security">
                    Your account is protected with secure authentication.
                </div>

                {!success && !otpStep && (
                    <p className="login-subtitle">
                        Already have an account?{" "}
                        <button
                            type="button"
                            className="forgot-link"
                            onClick={onBackToLogin}
                        >
                            Sign in
                        </button>
                    </p>
                )}
            </section>

            <p className="login-footer">
                Spend wisely. Save consistently.{" "}
                <span>Build your future.</span>
            </p>
        </main>
    );
}

export default Register;
