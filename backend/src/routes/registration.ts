import { Router } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { pool } from "../db.js";
import { sendVerificationEmail } from "../mailer.js";
import { ALLOWED_ORIGIN } from "../config.js";
import { hashOtp, issueOtp, sha256 } from "../lib/security.js";
import { sensitiveActionLimiter } from "../middleware/rateLimiters.js";
import { registerSchema } from "../schemas.js";

const router = Router();

router.post("/register", sensitiveActionLimiter, async (req, res) => {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: result.error.flatten(),
        });
    }

    const { name, email, password } = result.data;
    let client;

    try {
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "Email is already registered",
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        client = await pool.connect();
        await client.query("BEGIN");

        const newUser = await client.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, role, created_at`,
            [name, email, passwordHash]
        );

        await client.query("COMMIT");

        const user = newUser.rows[0];

        try {
            await issueOtp(user.id, user.email, "registration");
        } catch (emailError) {
            console.error("Registration OTP delivery failed:", emailError);

            return res.status(503).json({
                message:
                    "Your account was created, but we couldn't send the OTP. Please try requesting a new code.",
            });
        }

        return res.status(201).json({
            message:
                "Registration successful. Enter the six-digit OTP sent to your email to verify your account.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error: any) {
        if (client) {
            await client.query("ROLLBACK").catch(() => {});
        }

        if (error?.code === "23505") {
            return res.status(409).json({
                message: "Email is already registered",
            });
        }

        console.error("Register error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    } finally {
        client?.release();
    }
});

//====================verify registration otp============


router.post(
    "/verify-registration-otp",
    sensitiveActionLimiter,
    async (req, res) => {
        const { email, otp } = req.body ?? {};

        if (
            typeof email !== "string" ||
            typeof otp !== "string" ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({
                message: "A valid email and six-digit OTP are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        let client;

        try {
            client = await pool.connect();
            await client.query("BEGIN");

            const userResult = await client.query(
                `SELECT id, email_verified
                 FROM users
                 WHERE email = $1
                 FOR UPDATE`,
                [normalizedEmail]
            );

            if (userResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                    message: "Invalid or expired OTP",
                });
            }

            const user = userResult.rows[0];

            if (user.email_verified) {
                await client.query("COMMIT");
                return res.status(200).json({
                    message: "Email is already verified. You can log in.",
                });
            }

            const otpResult = await client.query(
                `SELECT id, otp_hash, attempts
                 FROM email_otps
                 WHERE user_id = $1
                   AND purpose = 'registration'
                   AND used_at IS NULL
                   AND expires_at > NOW()
                 ORDER BY created_at DESC
                 LIMIT 1
                 FOR UPDATE`,
                [user.id]
            );

            if (otpResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                    message: "Invalid or expired OTP. Request a new code.",
                });
            }

            const record = otpResult.rows[0];

            if (record.attempts >= 5) {
                await client.query("ROLLBACK");
                return res.status(429).json({
                    message: "Too many incorrect attempts. Request a new OTP.",
                });
            }

            if (hashOtp(otp) !== record.otp_hash.trim()) {
                await client.query(
                    `UPDATE email_otps
                     SET attempts = attempts + 1
                     WHERE id = $1`,
                    [record.id]
                );

                await client.query("COMMIT");

                return res.status(400).json({
                    message: "Incorrect OTP",
                });
            }

            await client.query(
                `UPDATE email_otps
                 SET used_at = NOW()
                 WHERE id = $1`,
                [record.id]
            );

            await client.query(
                `UPDATE users
                 SET email_verified = TRUE
                 WHERE id = $1`,
                [user.id]
            );

            await client.query("COMMIT");

            return res.status(200).json({
                message: "Email verified successfully. You can now log in.",
            });
        } catch (error) {
            if (client) {
                await client.query("ROLLBACK").catch(() => {});
            }

            console.error("Registration OTP verification error:", error);

            return res.status(500).json({
                message: "Something went wrong",
            });
        } finally {
            client?.release();
        }
    }
);

//=====================Resend otp=====================

router.post(
    "/resend-registration-otp",
    sensitiveActionLimiter,
    async (req, res) => {
        const { email } = req.body ?? {};

        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                message: "A valid email is required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        try {
            const result = await pool.query(
                `SELECT id, email, email_verified
                 FROM users
                 WHERE email = $1`,
                [normalizedEmail]
            );

            // Use the same response whether the account exists or not.
            const message =
                "If the account exists and needs verification, an OTP will be sent.";

            if (
                result.rows.length === 0 ||
                result.rows[0].email_verified
            ) {
                return res.status(200).json({ message });
            }

            const user = result.rows[0];

            // Enforce a 60-second resend cooldown.
            const recentOtp = await pool.query(
                `SELECT created_at
                 FROM email_otps
                 WHERE user_id = $1
                   AND purpose = 'registration'
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [user.id]
            );

            if (recentOtp.rows.length > 0) {
                const lastCreatedAt = new Date(
                    recentOtp.rows[0].created_at
                ).getTime();

                if (Date.now() - lastCreatedAt < 60_000) {
                    return res.status(429).json({
                        message: "Please wait 60 seconds before requesting another OTP.",
                    });
                }
            }

            await issueOtp(user.id, user.email, "registration");

            return res.status(200).json({ message });
        } catch (error) {
            console.error("Resend registration OTP error:", error);

            return res.status(500).json({
                message: "Something went wrong",
            });
        }
    }
);


// ==================== VERIFY EMAIL ====================

router.get("/verify-email", async (req, res) => {
    const token = req.query.token;

    if (typeof token !== "string" || !token.trim()) {
        return res.status(400).json({
            message: "A valid verification token is required",
        });
    }

    const tokenHash = sha256(token);

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        const result = await client.query(
            `SELECT id, user_id
             FROM email_verification_tokens
             WHERE token_hash = $1
               AND used_at IS NULL
               AND expires_at > NOW()
             FOR UPDATE`,
            [tokenHash]
        );

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Verification token is invalid, expired, or already used",
            });
        }

        const verificationRecord = result.rows[0];

        await client.query(
            `UPDATE users
             SET email_verified = TRUE
             WHERE id = $1`,
            [verificationRecord.user_id]
        );

        await client.query(
            `UPDATE email_verification_tokens
             SET used_at = NOW()
             WHERE id = $1`,
            [verificationRecord.id]
        );

        await client.query("COMMIT");

        return res.redirect(`${ALLOWED_ORIGIN}/?verified=success`);

    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Verification rollback error:", rollbackError);
            }
        }

        console.error("Email verification error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    } finally {
        client?.release();
    }
});

//=====================RESEND VERIFICATION================


router.post("/resend-verification", sensitiveActionLimiter, async (req, res) => {
    const { email } = req.body ?? {};

    if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
            message: "Email is required",
        });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();

        const userResult = await pool.query(
            `SELECT id, email_verified
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        );

        // Generic response avoids revealing whether an account exists
        const successMessage =
            "If the account exists and needs verification, a new verification link will be sent.";

        if (
            userResult.rows.length === 0 ||
            userResult.rows[0].email_verified
        ) {
            return res.status(200).json({
                message: successMessage,
            });
        }

        const userId = userResult.rows[0].id;

        const verificationToken =
            crypto.randomBytes(32).toString("hex");

        const verificationTokenHash = sha256(verificationToken);

        await sendVerificationEmail(email, verificationToken);
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            // Invalidate previous unused verification tokens
            await client.query(
                `UPDATE email_verification_tokens
                 SET used_at = NOW()
                 WHERE user_id = $1
                   AND used_at IS NULL`,
                [userId]
            );

            // Store the new token hash for 15 minutes
            await client.query(
                `INSERT INTO email_verification_tokens
                 (user_id, token_hash, expires_at)
                 VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
                [userId, verificationTokenHash]
            );

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
         // DEVELOPMENT ONLY: replace with email delivery later
        return res.status(200).json({
            message: successMessage,
        });
    } catch (error) {
        console.error("Resend verification error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
});

export default router;
