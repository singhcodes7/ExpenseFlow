
import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpUser || !smtpPass) {
    throw new Error("SMTP_USER or SMTP_PASS is missing");
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: smtpUser,
        pass: smtpPass,
    },
});

export async function sendVerificationEmail(
    email: string,
    verificationToken: string
) {
    const verificationUrl =
        `http://localhost:5000/verify-email?token=${encodeURIComponent(verificationToken)}`;

    await transporter.sendMail({
        from: `"My Auth App" <${smtpUser}>`,
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
}


export async function sendPasswordResetEmail(
    email: string,
    resetToken: string
) {
    const resetUrl =
        `http://localhost:5173/reset-password?token=${encodeURIComponent(resetToken)}`;

    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "Reset your password",
        text: `You requested a password reset.

Open this link to reset your password:
${resetUrl}

This link expires in 15 minutes. If you did not request this, ignore this email.`,
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
}

transporter.verify()
    .then(() => console.log("SMTP server is ready"))
    .catch((error) => console.error("SMTP connection failed:", error));
