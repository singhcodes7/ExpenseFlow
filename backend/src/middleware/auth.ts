import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { JWT_SECRET } from "../config.js";

export const authenticateToken = async (
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
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};

export function authorizeAdmin(req: any, res: any, next: any) {
    if (req.userRole !== "admin") {
        return res.status(403).json({
            message: "Access denied. Admins only.",
        });
    }

    next();
}
