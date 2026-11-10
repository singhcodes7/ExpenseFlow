import express from "express";
import { ALLOWED_ORIGIN } from "../config.js";

export const csrfProtection = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
): void => {
    if (req.path === "/refresh" || req.originalUrl?.includes("refresh") || req.path === "/health") {
        return next();
    }

    const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];

    if (stateChangingMethods.includes(req.method)) {
        const origin = req.get("Origin");

        const isAllowed = 
            !origin ||
            origin === ALLOWED_ORIGIN || 
            origin.endsWith(".vercel.app") ||
            origin.includes("localhost");

        if (!isAllowed) {
            res.status(403).json({
                message: "Untrusted or missing request origin",
            });
            return;
        }
    }

    next();
};