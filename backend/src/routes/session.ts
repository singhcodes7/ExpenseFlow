import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { DUMMY_HASH, JWT_SECRET, REFRESH_COOKIE_MAX_AGE, refreshCookieOptions } from "../config.js";
import { hashOtp, issueOtp, sha256, signAccessToken, signRefreshToken } from "../lib/security.js";
import { authenticateToken } from "../middleware/auth.js";
import { loginLimiter, sensitiveActionLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/login", loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body ?? {};

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            await bcrypt.compare(password, DUMMY_HASH);

            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        if (!user.email_verified) {
            return res.status(403).json({
                message: "Please verify your email before logging in",
            });
        }

        // Password is correct. Send a login OTP, but issue NO tokens yet.
        await issueOtp(user.id, user.email, "login");

        return res.status(200).json({
            message: "A login verification code has been sent to your email.",
            requiresOtp: true,
            email: user.email,
        });
    } catch (error) {
        console.error("Login OTP request error:", error);

        return res.status(500).json({
            message: "Unable to start login verification. Please try again.",
        });
    }
});

//======================verify login otp===================


router.post(
    "/verify-login-otp",
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
                `SELECT id, name, email, email_verified
                 FROM users
                 WHERE email = $1
                 FOR UPDATE`,
                [normalizedEmail]
            );

            if (
                userResult.rows.length === 0 ||
                !userResult.rows[0].email_verified
            ) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                    message: "Invalid or expired OTP",
                });
            }

            const user = userResult.rows[0];

            const otpResult = await client.query(
                `SELECT id, otp_hash, attempts
                 FROM email_otps
                 WHERE user_id = $1
                   AND purpose = 'login'
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
                    message: "Invalid or expired OTP. Please log in again.",
                });
            }

            const record = otpResult.rows[0];

            if (record.attempts >= 5) {
                await client.query("ROLLBACK");
                return res.status(429).json({
                    message: "Too many incorrect attempts. Please log in again.",
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

            const accessToken = signAccessToken(user.id);
            const refreshToken = signRefreshToken(user.id);

            await client.query(
                `INSERT INTO refresh_tokens
                    (user_id, token_hash, expires_at)
                 VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
                [user.id, sha256(refreshToken)]
            );

            await client.query("COMMIT");

            res.cookie("refreshToken", refreshToken, {
                ...refreshCookieOptions,
                maxAge: REFRESH_COOKIE_MAX_AGE,
            });

            return res.status(200).json({
                message: "Login successful",
                accessToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            });
        } catch (error) {
            if (client) {
                await client.query("ROLLBACK").catch(() => {});
            }

            console.error("Login OTP verification error:", error);

            return res.status(500).json({
                message: "Unable to verify login OTP",
            });
        } finally {
            client?.release();
        }
    }
);

//======================verify login otp================


router.post(
    "/resend-login-otp",
    sensitiveActionLimiter,
    async (req, res) => {
        const { email } = req.body ?? {};

        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                message: "A valid email is required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const message =
            "If the account is eligible, a new login OTP will be sent.";

        try {
            const userResult = await pool.query(
                `SELECT id, email, email_verified
                 FROM users
                 WHERE email = $1`,
                [normalizedEmail]
            );

            if (
                userResult.rows.length === 0 ||
                !userResult.rows[0].email_verified
            ) {
                return res.status(200).json({ message });
            }

            const user = userResult.rows[0];

            // Enforce a 60-second cooldown for login OTP resends.
            const recentOtp = await pool.query(
                `SELECT created_at
                 FROM email_otps
                 WHERE user_id = $1
                   AND purpose = 'login'
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
                        message:
                            "Please wait 60 seconds before requesting another OTP.",
                    });
                }
            }

            await issueOtp(user.id, user.email, "login");

            return res.status(200).json({ message });
        } catch (error) {
            console.error("Resend login OTP error:", error);

            return res.status(500).json({
                message: "Unable to resend login OTP",
            });
        }
    }
);


// ==================== REFRESH TOKEN ====================

router.post("/refresh", async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (typeof refreshToken !== "string" || !refreshToken) {
        return res.status(401).json({
            message: "Refresh token missing",
        });
    }

    let decoded: jwt.JwtPayload;

    try {
        const verified = jwt.verify(refreshToken, JWT_SECRET, {
            algorithms: ["HS256"],
        });

        if (
            typeof verified === "string" ||
            verified.type !== "refresh" ||
            typeof verified.userId !== "number"
        ) {
            return res.status(403).json({
                message: "Invalid refresh token",
            });
        }

        decoded = verified;
    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired refresh token",
        });
    }

    let client;

    try {
        const tokenHash = sha256(refreshToken);

        const result = await pool.query(
            `SELECT id, user_id
             FROM refresh_tokens
             WHERE token_hash = $1
               AND user_id = $2
               AND revoked_at IS NULL
               AND expires_at > NOW()`,
            [tokenHash, decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({
                message: "Refresh token invalid or revoked",
            });
        }

        const oldTokenId = result.rows[0].id;
        const userId = result.rows[0].user_id;

        const newAccessToken = signAccessToken(userId);
        const newRefreshToken = signRefreshToken(userId);
        const newTokenHash = sha256(newRefreshToken);

        client = await pool.connect();

        await client.query("BEGIN");

        const revokeResult = await client.query(
            `UPDATE refresh_tokens
             SET revoked_at = NOW()
             WHERE id = $1
               AND revoked_at IS NULL`,
            [oldTokenId]
        );

        if (revokeResult.rowCount !== 1) {
            await client.query("ROLLBACK");

            return res.status(403).json({
                message: "Refresh token already used",
            });
        }

        await client.query(
            `INSERT INTO refresh_tokens
             (user_id, token_hash, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
            [userId, newTokenHash]
        );

        await client.query("COMMIT");

        res.cookie("refreshToken", newRefreshToken, {
            ...refreshCookieOptions,
            maxAge: REFRESH_COOKIE_MAX_AGE,
        });

        return res.json({
            accessToken: newAccessToken,
        });
    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Refresh rollback error:", rollbackError);
            }
        }

        console.error("Refresh error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    } finally {
        client?.release();
    }
});

// ==================== LOGOUT ====================

router.post("/logout", async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    try {
        // Revoke the refresh token in the database too
        if (typeof refreshToken === "string" && refreshToken) {
            await pool.query(
                `UPDATE refresh_tokens
                 SET revoked_at = NOW()
                 WHERE token_hash = $1
                   AND revoked_at IS NULL`,
                [sha256(refreshToken)]
            );
        }
    } catch (error) {
        console.error("Logout error:", error);
    }

    res.clearCookie("refreshToken", refreshCookieOptions);

    return res.status(200).json({
        message: "Logged out successfully",
    });
});

router.post("/logout-all", authenticateToken, async (req, res) => {
    try {
        const userId = (req as any).userId;

        await pool.query(
            `UPDATE refresh_tokens
             SET revoked_at = NOW()
             WHERE user_id = $1
               AND revoked_at IS NULL`,
            [userId]
        );

        res.clearCookie("refreshToken", refreshCookieOptions);

        return res.status(200).json({
            message: "Logged out from all devices successfully",
        });
    } catch (error) {
        console.error("Logout all error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

export default router;
