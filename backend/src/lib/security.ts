import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../db.js";
import { sendOtpEmail } from "../mailer.js";
import { JWT_SECRET } from "../config.js";

export const sha256 = (value: string) =>
    crypto.createHash("sha256").update(value).digest("hex");


export const generateOtp = () =>
    crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

export const hashOtp = (otp: string) => sha256(otp);

export async function issueOtp(
    userId: number,
    email: string,
    purpose: "registration" | "login"
) {
    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Invalidate previous unused OTPs for this purpose.
        await client.query(
            `UPDATE email_otps
             SET used_at = NOW()
             WHERE user_id = $1
               AND purpose = $2
               AND used_at IS NULL`,
            [userId, purpose]
        );

        // Store only the hash; expire after five minutes.
        await client.query(
            `INSERT INTO email_otps
                (user_id, otp_hash, purpose, expires_at)
             VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')`,
            [userId, otpHash, purpose]
        );

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
    } finally {
        client.release();
    }

    // Send only after the database transaction succeeds.
    await sendOtpEmail(email, otp, purpose);
}

export const signAccessToken = (userId: number) =>
    jwt.sign({ userId, type: "access" }, JWT_SECRET, {
        expiresIn: "15m",
        algorithm: "HS256",
    });

export const signRefreshToken = (userId: number) =>
    jwt.sign({ userId, type: "refresh" }, JWT_SECRET, {
        expiresIn: "7d",
        algorithm: "HS256",
        jwtid: crypto.randomUUID(), // makes every refresh token unique
    });
