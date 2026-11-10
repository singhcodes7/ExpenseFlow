import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const FRONTEND_URL = (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, "");
const API_URL = (process.env.API_URL ?? "http://localhost:5000").replace(/\/$/, "");

if (!smtpUser || !smtpPass) {
    throw new Error("SMTP_USER or SMTP_PASS is missing");
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: smtpUser,
        pass: smtpPass,
    },
    // Timeouts prevent the server from hanging indefinitely if ports are blocked
    connectionTimeout: 10000, 
    greetingTimeout: 10000,
    socketTimeout: 10000,
});

export async function sendVerificationEmail(
    email: string,
    verificationToken: string
) {
    const verificationUrl =
        `${API_URL}/verify-email?token=${encodeURIComponent(verificationToken)}`;

    try {
        await transporter.sendMail({
            from: `"EXPENSEFLOW" <${smtpUser}>`,
            to: email,
            subject: "Verify your email address",
            text: `Verify your email: ${verificationUrl}`,
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
        await transporter.sendMail({
            from: `"ExpenseFlow" <${smtpUser}>`,
            to: email,
            subject,
            text: `${heading}\n\nYour verification code is: ${otp}\n\nThis code expires in 5 minutes. Do not share it with anyone.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px;">
                    <h2>${heading}</h2>
                    <p>Use the following code to continue:</p>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px 0;">
                        ${otp}
                    </div>
                    <p>This code expires in 5 minutes.</p>
                    <p>If you did not request this code, you can ignore this email.</p>
                    <p style="color: #666; font-size: 12px;">
                        Never share your verification code with anyone.
                    </p>
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
    const resetUrl =
        `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
    
    try {
        await transporter.sendMail({
            from: smtpUser,
            to: email,
            subject: "Reset your password",
            text: `You requested a password reset.\n\nOpen this link to reset your password:\n${resetUrl}\n\nThis link expires in 15 minutes. If you did not request this, ignore this email.`,
            html: `
                <h2>Reset your password</h2>
                <p>You requested a password reset.</p>
                <p>
                    <a href="${resetUrl}">Reset your password</a>
                </p>
                <p>This link expires in 15 minutes.</p>
                <p>If you did not request this, ignore this email.</p>
            `,
        });
    } catch (error) {
        console.error("Failed to send password reset email:", error);
    }
}

transporter.verify()
    .then(() => console.log("SMTP server is ready"))
    .catch((error) => console.error("SMTP connection failed:", error));