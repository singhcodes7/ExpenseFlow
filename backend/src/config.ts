import "dotenv/config";
import bcrypt from "bcrypt";

export const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set in the environment");
}

export const IS_PROD = process.env.NODE_ENV === "production";

export const ALLOWED_ORIGIN = (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, "");
export const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export const COOKIE_SAMESITE = (process.env.COOKIE_SAMESITE ?? "strict") as "strict" | "lax" | "none";

export const refreshCookieOptions = {
    httpOnly: true,
    secure: IS_PROD || COOKIE_SAMESITE === "none",
    sameSite: "none",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE,
};

// Used to keep login timing similar when the email does not exist
export const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 12);
