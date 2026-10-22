import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../api";
import "./EmailVerified.css";

export default function EmailVerified() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Please wait while we verify your email.");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("The verification link is missing its token.");
      return;
    }

    async function verifyEmail() {
      try {
        const response = await fetch(
          `http://localhost:5000/verify-email?token=${encodeURIComponent(token)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Verification failed.");
        }

        setStatus("success");
        setMessage("Your email has been verified successfully. You can now sign in.");
      } catch (error) {
        setStatus("error");
        setMessage(error.message || "Unable to verify your email.");
      }
    }

    verifyEmail();
  }, [searchParams]);

  return (
    <main className="verification-page">
      <section className="verification-card">
        <div className={`verification-icon ${status}`}>
          {status === "success" ? "✓" : status === "error" ? "!" : "…"}
        </div>

        <p className="verification-eyebrow">EXPENSEFLOW ACCOUNT</p>

        <h1>
          {status === "verifying"
            ? "Verifying your email"
            : status === "success"
            ? "Email verified!"
            : "Verification failed"}
        </h1>

        <p className="verification-message">{message}</p>

        {status === "success" && (
          <button onClick={() => navigate("/")}>
            Continue to sign in
          </button>
        )}

        {status === "error" && (
          <button onClick={() => navigate("/")}>
            Back to sign in
          </button>
        )}

        {status === "verifying" && (
          <div className="verification-loader" />
        )}

        <p className="verification-footer">
          ExpenseFlow · Your finances, organized.
        </p>
      </section>
    </main>
  );
}