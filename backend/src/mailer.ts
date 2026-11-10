import { Resend } from "resend";

// Fallback dummy key prevents tests from crashing when RESEND_API_KEY isn't set in CI/CD
const resend = new Resend(process.env.RESEND_API_KEY || "re_test_dummy_key");
const FRONTEND_URL = (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, "");
const API_URL = (process.env.API_URL ?? "http://localhost:5000").replace(/\/$/, "");

const SENDER_EMAIL = process.env.EMAIL_FROM ?? "ExpenseFlow <onboarding@resend.dev>";

export async function sendVerificationEmail(
    email: string,
    verificationToken: string
) {
    const verificationUrl = `${API_URL}/verify-email?token=${encodeURIComponent(verificationToken)}`;

    try {
        await resend.emails.send({
            from: SENDER_EMAIL,
            to: email,
            subject: "Verify your email address",
            html: `
                <h2>Verify your email</h2>
                <p>Click below to verify your email address.</p>
                <a href="${verificationUrl}">Verify Email</a>
                <p>This link expires in 15 minutes.</p>
            `,
        });
    } catch (error) {
        console.error("Failed to send verification email:", error);
    }
}

export async function sendOtpEmail(
    email: string,
    otp: string,
    purpose: "registration" | "login"
) {
    const isRegistration = purpose === "registration";
    const subject = isRegistration
        ? "Verify your ExpenseFlow account"
        : "Your ExpenseFlow login code";
    const heading = isRegistration
        ? "Verify your email address"
        : "Your login verification code";

    try {
        await resend.emails.send({
            from: SENDER_EMAIL,
            to: email,
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px;">
                    <h2>${heading}</h2>
                    <p>Use the following code to continue:</p>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px 0;">
                        ${otp}
                    </div>
                    <p>This code expires in 5 minutes.</p>
                    <p>If you did not request this code, you can ignore this email.</p>
                </div>
            `,
        });
    } catch (error) {
        console.error("Failed to send OTP email:", error);
    }
}

export async function sendPasswordResetEmail(
    email: string,
    resetToken: string
) {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
    
    try {
        await resend.emails.send({
            from: SENDER_EMAIL,
            to: email,
            subject: "Reset your password",
            html: `
                <h2>Reset your password</h2>
                <p>You requested a password reset.</p>
                <p><a href="${resetUrl}">Reset your password</a></p>
                <p>This link expires in 15 minutes.</p>
            `,
        });
    } catch (error) {
        console.error("Failed to send password reset email:", error);
    }
}