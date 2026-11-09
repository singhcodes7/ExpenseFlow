import { Router } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { pool } from "../db.js";
import { sendPasswordResetEmail } from "../mailer.js";
import { sha256 } from "../lib/security.js";
import { authenticateToken } from "../middleware/auth.js";
import { sensitiveActionLimiter } from "../middleware/rateLimiters.js";
import { changePasswordSchema, passwordSchema } from "../schemas.js";

const router = Router();

router.post("/forgot-password", sensitiveActionLimiter, async (req, res) => {
    console.log("Forgot password route reached:", req.body.email);
    const { email } = req.body ?? {};

    if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
            message: "A valid email is required",
        });
    }

    try {
        const result = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email.trim().toLowerCase()]
        );

        // Always return the same response, even if the email
        // does not belong to a registered user.
        const message =
            "If the account exists, reset instructions will be provided.";

        if (result.rows.length === 0) {
            return res.status(200).json({ message });
        }

        const userId = result.rows[0].id;

        const resetToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = sha256(resetToken);

        // Invalidate older unused tokens
        await pool.query(
            `UPDATE password_reset_tokens
             SET used_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND used_at IS NULL`,
            [userId]
        );

        // Save the new token
        await pool.query(
            `INSERT INTO password_reset_tokens
             (user_id, token_hash, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
            [userId, tokenHash]
        );

        // DEVELOPMENT ONLY: do not expose reset tokens in production.
        try {
            await sendPasswordResetEmail(
                email.trim().toLowerCase(),
                resetToken
            );
        } catch (emailError) {
            console.error("Password reset email failed:", emailError);
        }

        return res.status(200).json({ message });
    } catch (error) {
        console.error("Forgot-password error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
});

// ==================== RESET PASSWORD ====================

router.post("/reset-password", sensitiveActionLimiter, async (req, res) => {
    const { token, newPassword } = req.body ?? {};

    if (typeof token !== "string" || !token.trim()) {
        return res.status(400).json({
            message: "A valid reset token is required",
        });
    }

    const passwordResult = passwordSchema.safeParse(newPassword);

    if (!passwordResult.success) {
        return res.status(400).json({
            message: "Password does not meet the requirements",
        });
    }

    const tokenHash = sha256(token);

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        const result = await client.query(
            `SELECT id, user_id
             FROM password_reset_tokens
             WHERE token_hash = $1
               AND used_at IS NULL
               AND expires_at > NOW()
             FOR UPDATE`,
            [tokenHash]
        );

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Reset token is invalid or expired",
            });
        }

        const resetRecord = result.rows[0];

        const passwordHash = await bcrypt.hash(passwordResult.data, 12);

        await client.query(
            `UPDATE users
             SET password_hash = $1
             WHERE id = $2`,
            [passwordHash, resetRecord.user_id]
        );

        await client.query(
            `UPDATE password_reset_tokens
             SET used_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [resetRecord.id]
        );

        // Revoke all existing sessions
        await client.query(
            `UPDATE refresh_tokens
             SET revoked_at = CURRENT_TIMESTAMP
             WHERE user_id = $1
               AND revoked_at IS NULL`,
            [resetRecord.user_id]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Password reset successful. Please log in again.",
        });
    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rollback error:", rollbackError);
            }
        }

        console.error("Reset-password error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    } finally {
        client?.release();
    }
});

router.post(
    "/change-password",
    authenticateToken,
    sensitiveActionLimiter,
    async (req, res) => {
        const client = await pool.connect();

        try {
            const parsed = changePasswordSchema.safeParse(req.body);

            if (!parsed.success) {
                return res.status(400).json({
                    message: "Invalid input"
                });
            }

            const { currentPassword, newPassword } = parsed.data;

            // bcrypt supports passwords up to 72 UTF-8 bytes
            if (Buffer.byteLength(newPassword, "utf8") > 72) {
                return res.status(400).json({
                    message: "New password is too long"
                });
            }

            const userId = (req as any).userId;

            await client.query("BEGIN");

            // Lock this user's row during the password change
            const result = await client.query(
                `SELECT password_hash
                 FROM users
                 WHERE id = $1
                 FOR UPDATE`,
                [userId]
            );

            if (result.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({
                    message: "User not found"
                });
            }

            const currentHash = result.rows[0].password_hash;

            const isMatch = await bcrypt.compare(
                currentPassword,
                currentHash
            );

            if (!isMatch) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                    message: "Current password is incorrect"
                });
            }

            const isSamePassword = await bcrypt.compare(
                newPassword,
                currentHash
            );

            if (isSamePassword) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                    message: "New password must be different"
                });
            }

            const newHash = await bcrypt.hash(newPassword, 12);

            await client.query(
                `UPDATE users
                 SET password_hash = $1
                 WHERE id = $2`,
                [newHash, userId]
            );

            // Revoke all refresh tokens for this user
            await client.query(
                `UPDATE refresh_tokens
                 SET revoked_at = NOW()
                 WHERE user_id = $1
                   AND revoked_at IS NULL`,
                [userId]
            );

            await client.query("COMMIT");

            return res.status(200).json({
                message:
                    "Password changed successfully. Please log in again."
            });
        } catch (error) {
            await client.query("ROLLBACK").catch(() => {});
            console.error("Change password error:", error);

            return res.status(500).json({
                message: "Internal server error"
            });
        } finally {
            client.release();
        }
    }
);

export default router;
