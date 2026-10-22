
import React, { useState } from "react";
import { apiRequest } from "../api";
import ForgotPassword from "./Forgotpassword";
import "./Login.css";

function Login({ onLogin, onRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await apiRequest("/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            sessionStorage.setItem("accessToken", data.accessToken);
            onLogin(data.user);
        } catch (err) {
            setError(err.message);
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
                    <p className="login-eyebrow">WELCOME BACK</p>
                    <h1>Good to see you.</h1>
                    <p className="login-subtitle">
                        Sign in to manage your money smarter.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
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
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="login-error" role="alert">
                            <span aria-hidden="true">!</span>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="login-spinner"></span>
                                Signing in...
                            </>
                        ) : (
                            <>
                                Sign in
                                <span aria-hidden="true">→</span>
                            </>
                        )}
                    </button>
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
            </section>

            <p className="login-footer">
                Spend wisely. Save consistently. <span>Build your future.</span>
            </p>
        </main>
    );
}

export default Login;
