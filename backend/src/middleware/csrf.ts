import express from "express";
import { ALLOWED_ORIGIN } from "../config.js";

export const csrfProtection = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
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
};
