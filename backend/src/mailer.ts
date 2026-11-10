import { BrevoClient } from "@getbrevo/brevo";

const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY || "dummy_key_for_ci",
});

const FRONTEND_URL = (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, "");
const API_URL = (process.env.API_URL ?? "http://localhost:5000").replace(/\/$/, "");

const SENDER_EMAIL = process.env.EMAIL_FROM || "kalyanising2002@gmail.com";
const SENDER_NAME = "ExpenseFlow";

export async function sendVerificationEmail(
    email: string,
    verificationToken: string
) {
    const verificationUrl = `${API_URL}/verify-email?token=${encodeURIComponent(verificationToken)}`;

    try {
        await brevo.transactionalEmails.sendTransacEmail({
            sender: { email: SENDER_EMAIL, name: SENDER_NAME },
            to: [{ email }],
            subject: "Verify your email address",
            htmlContent: `
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
        await brevo.transactionalEmails.sendTransacEmail({
            sender: { email: SENDER_EMAIL, name: SENDER_NAME },
            to: [{ email }],
            subject,
            htmlContent: `
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
        await brevo.transactionalEmails.sendTransacEmail({
            sender: { email: SENDER_EMAIL, name: SENDER_NAME },
            to: [{ email }],
            subject: "Reset your password",
            htmlContent: `
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