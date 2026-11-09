
import { useState, useEffect } from "react";
import { apiRequest } from "../api";
import ForgotPassword from "./Forgotpassword";
import "./Login.css";

function Login({ onLogin, onRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [otpStep, setOtpStep] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
const [resendingOtp, setResendingOtp] = useState(false);
const [resendCooldown, setResendCooldown] = useState(0);

const handleResendLoginOtp = async () => {
    if (resendingOtp || resendCooldown > 0) return;

    setError("");
    setMessage("");
    setResendingOtp(true);

    try {
        const data = await apiRequest("/resend-login-otp", {
            method: "POST",
            body: JSON.stringify({
                email: email.trim().toLowerCase(),
            }),
        });

        setMessage(
            data.message || "If eligible, a new verification code will be sent."
        );
        setResendCooldown(60);
    } catch (err) {
        setError(err.message || "Unable to resend the code. Please try again.");
    } finally {
        setResendingOtp(false);
    }
};
    
useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setTimeout(() => {
        setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timer);
}, [resendCooldown]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            if (!otpStep) {
                const data = await apiRequest("/login", {
                    method: "POST",
                    body: JSON.stringify({ email, password }),
                });

                if (data.requiresOtp) {
                setOtpStep(true);
                setMessage(data.message);
                setResendCooldown(60);
} else {
                    setError("Unexpected server response. Please try again.");
                }
            } else {
                const data = await apiRequest("/verify-login-otp", {
                    method: "POST",
                    body: JSON.stringify({
                        email,
                        otp,
                    }),
                });

                if (!data.accessToken || !data.user) {
                    throw new Error("Unexpected server response. Please try again.");
                }

                sessionStorage.setItem("accessToken", data.accessToken);
                onLogin(data.user);
            }
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (showForgotPassword) {
        return (
            <ForgotPassword
                onBack={() => setShowForgotPassword(false)}
            />
        );
    }

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
                    <span>Expense<span className="brand-accent">Flow</span></span>
                </div>

                <div className="login-heading">
                    <p className="login-eyebrow">
                        {otpStep ? "TWO-STEP VERIFICATION" : "WELCOME BACK"}
                    </p>
                    <h1>
                        {otpStep ? "Check your email." : "Good to see you."}
                    </h1>
                    <p className="login-subtitle">
                        {otpStep
                            ? `Enter the six-digit code sent to ${email}.`
                            : "Sign in to manage your money smarter."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {!otpStep ? (
                        <>
                            <div className="login-field">
                                <label htmlFor="email">Email address</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="login-field">
                                <div className="login-password-heading">
                                    <label htmlFor="password">Password</label>
                                    <button
                                        type="button"
                                        className="forgot-link"
                                        onClick={() => setShowForgotPassword(true)}
                                    >
                                        Forgot password?
                                    </button>
                                </div>

                                <div className="password-input-wrap">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
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
                            </div>
                        </>
                    ) : (
                        <div className="login-field">
                            <label htmlFor="otp">Six-digit email code</label>
                            <input
                                id="otp"
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
                        {loading ? (
                            <>
                                <span className="login-spinner"></span>
                                {otpStep ? "Verifying your identity..." : "Authenticating..."}
                            </>
                        ) : (
                            <>
                                {otpStep ? "Verify & Sign In" : "Sign In"}
                                <span aria-hidden="true">→</span>
                            </>
                        )}
                    </button>
                    

{otpStep && (
    <button
        type="button"
        className="forgot-link resend-otp-button"
        onClick={handleResendLoginOtp}
        disabled={loading || resendingOtp || resendCooldown > 0}
        aria-live="polite"
    >
        {resendingOtp ? (
            "Sending code..."
        ) : resendCooldown > 0 ? (
            <>
                Resend OTP in{" "}
                <span className="resend-otp-timer">
                    {String(Math.floor(resendCooldown / 60)).padStart(2, "0")}:
                    {String(resendCooldown % 60).padStart(2, "0")}
                </span>
            </>
        ) : (
            "Resend OTP"
        )}
    </button>
)}


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
                            Back to login
                        </button>
                    )}
                </form>

                <div className="login-security">
                    <svg
                        width="16"
                        height="16"
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
                    Your financial data stays protected.
                </div>

                {!otpStep && (
                    <p className="login-subtitle">
                        Don't have an account?{" "}
                        <button
                            type="button"
                            className="forgot-link"
                            onClick={onRegister}
                        >
                            Create account
                        </button>
                    </p>
                )}
            </section>

            <p className="login-footer">
                Spend wisely. Save consistently. <span>Build your future.</span>
            </p>
        </main>
    );
}

export default Login;
