import express from "express";
import { ALLOWED_ORIGIN } from "../config.js";

export const csrfProtection = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    if (req.path.includes("refresh") || req.path === "/health") {
        return next();
    }

    const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];

    if (stateChangingMethods.includes(req.method)) {
        const origin = req.get("Origin");

        // Allow requests with matching origin, vercel domains, localhost, or missing origin (safeguard)
        const isAllowed = 
            !origin ||
            origin === ALLOWED_ORIGIN || 
            origin.endsWith(".vercel.app") ||
            origin.includes("localhost");

        if (!isAllowed) {
            return res.status(403).json({
                message: "Untrusted or missing request origin",
            });
        }
    }

    next();
};