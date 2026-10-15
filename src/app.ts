import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "./db";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import cors from "cors";
import "dotenv/config";
import "./mailer.js"
import { sendVerificationEmail } from "./mailer.js";
import { sendPasswordResetEmail } from "./mailer.js";
import helmet from "helmet";
dotenv.config();
 
const app = express();

const JWT_SECRET = process.env.JWT_SECRET as string;
const PORT = Number(process.env.PORT ?? 5000);
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set in the environment");
}

const IS_PROD = process.env.NODE_ENV === "production";

const ALLOWED_ORIGIN = "http://localhost:5173";
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const refreshCookieOptions = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Used to keep login timing similar when the email does not exist
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 12);

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: ALLOWED_ORIGIN,
        credentials: true,
    })
);

app.use(helmet());
// ==================== HELPERS ====================

const sha256 = (value: string) =>
    crypto.createHash("sha256").update(value).digest("hex");

const signAccessToken = (userId: number) =>
    jwt.sign({ userId, type: "access" }, JWT_SECRET, {
        expiresIn: "15m",
        algorithm: "HS256",
    });

const signRefreshToken = (userId: number) =>
    jwt.sign({ userId, type: "refresh" }, JWT_SECRET, {
        expiresIn: "7d",
        algorithm: "HS256",
        jwtid: crypto.randomUUID(), // makes every refresh token unique
    });

// ==================== CSRF MIDDLEWARE ====================

app.use((req, res, next) => {
    const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];

    if (stateChangingMethods.includes(req.method)) {
        const origin = req.get("Origin");

        if (origin !== ALLOWED_ORIGIN) {
            return res.status(403).json({
                message: "Untrusted or missing request origin",
            });
        }
    }

    next();
});

// ==================== JWT MIDDLEWARE ====================

const authenticateToken = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({
            message: "Access token required",
        });
    }

    // Expect "Bearer TOKEN"
    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Invalid Authorization header",
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            algorithms: ["HS256"],
        });

        if (
            typeof decoded === "string" ||
            decoded.type !== "access" ||
            typeof decoded.userId !== "number"
        ) {
            return res.status(403).json({
                message: "Invalid token payload",
            });
        }

        const result = await pool.query(
            "SELECT id, role FROM users WHERE id = $1",
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "User not found",
            });
        }

        req.userId = result.rows[0].id;
        req.userRole = result.rows[0].role;

        next();
    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired token",
        });
    }
};

// ==================== AUTHORIZATION MIDDLEWARE ====================

function authorizeAdmin(req: any, res: any, next: any) {
    if (req.userRole !== "admin") {
        return res.status(403).json({
            message: "Access denied. Admins only.",
        });
    }

    next();
}

// ==================== ADMIN ONLY ROUTE ====================

app.get("/admin", authenticateToken, authorizeAdmin, (req, res) => {
    res.json({
        message: "Welcome, admin!",
    });
});

// ==================== ZOD SCHEMAS ====================

const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character");

const registerSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email address"),
    password: passwordSchema,
});

const updateProfileSchema = z.object({
    name: z.string().min(2).max(50),
}).strict();

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72)
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[^a-zA-Z0-9]/, "Must contain a special character"),
}).strict();

// ==================== RATE LIMITERS ====================

const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 5,
    message: {
        message: "Too many login attempts. Try again later.",
    },
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

const sensitiveActionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,
    message: {
        message: "Too many requests. Try again later.",
    },
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

// ==================== REGISTER ====================


app.post("/register", sensitiveActionLimiter, async (req, res) => {
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

        // Hash the user's password
        const passwordHash = await bcrypt.hash(password, 12);

        // Generate verification token and its hash
        const verificationToken = crypto
            .randomBytes(32)
            .toString("hex");

        const verificationTokenHash = sha256(verificationToken);

        client = await pool.connect();
        await client.query("BEGIN");

        // Create the user
        const newUser = await client.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, role, created_at`,
            [name, email, passwordHash]
        );

        const userId = newUser.rows[0].id;

        // Store only the hashed verification token
        await client.query(
            `INSERT INTO email_verification_tokens
             (user_id, token_hash, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
            [userId, verificationTokenHash]
        );

        // Commit the database transaction
        await client.query("COMMIT");

        // Send the verification email after committing
        try {
            await sendVerificationEmail(email, verificationToken);
        } catch (emailError) {
            console.error("Verification email failed:", emailError);
        }

        return res.status(201).json({
            message:
                "Registration successful. Please check your email to verify your account.",
            user: newUser.rows[0],
        });

    } catch (error: any) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Register rollback error:",
                    rollbackError
                );
            }
        }

        // Handle duplicate email race conditions
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


//=====================RESEND VERIFICATION================


app.post("/resend-verification", sensitiveActionLimiter, async (req, res) => {
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
        console.log("New email verification token:", verificationToken);

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

// ==================== VERIFY EMAIL ====================

app.get("/verify-email", async (req, res) => {
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

        return res.status(200).json({
            message: "Email verified successfully. You can now log in.",
        });
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

// ==================== LOGIN ====================

app.post("/login", loginLimiter, async (req, res) => {
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

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email.trim().toLowerCase()]
        );

        if (result.rows.length === 0) {
            // Keep response time similar to the "wrong password" path
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

        // Checked after the password so that unverified status is only
        // revealed to someone who knows the correct password.
        if (!user.email_verified) {
            return res.status(403).json({
                message: "Please verify your email before logging in",
            });
        }

        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);

        await pool.query(
            `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
            [user.id, sha256(refreshToken)]
        );

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
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

// ==================== REFRESH TOKEN ====================

app.post("/refresh", async (req, res) => {
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

app.post("/logout", async (req, res) => {
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

// ==================== PROTECTED PROFILE ====================

app.get("/profile", authenticateToken, async (req, res) => {
    try {
        const userId = (req as any).userId;

        const result = await pool.query(
            `SELECT id, name, email, created_at
             FROM users
             WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Profile error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

//=============profile-update route===========

app.patch("/profile", authenticateToken, async (req, res) => {
    try {
        const parsed = updateProfileSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                message: "Invalid input. Only name can be updated.",
            });
        }

        const userId = (req as any).userId;
        const { name } = parsed.data;

        const result = await pool.query(
            `UPDATE users
             SET name = $1
             WHERE id = $2
             RETURNING id, name, email, created_at`,
            [name, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message: "Profile updated successfully",
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Profile update error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

// ==================== FORGOT PASSWORD ====================

app.post("/forgot-password", sensitiveActionLimiter, async (req, res) => {
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

app.post("/reset-password", sensitiveActionLimiter, async (req, res) => {
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



// ==================== LOGOUT ALL DEVICES ====================

app.post("/logout-all", authenticateToken, async (req, res) => {
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

///================change password route========
app.post(
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


// ==================== CENTRALIZED ERROR HANDLER ====================

app.use(
    (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        console.error(err);

        if (res.headersSent) {
            return next(err);
        }

        // Malformed JSON body
        if (err?.type === "entity.parse.failed") {
            return res.status(400).json({
                message: "Invalid JSON body",
            });
        }

        return res.status(500).json({
            message: "Internal server error",
        });
    }
);

export default app;