import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 5,
    message: {
        message: "Too many login attempts. Try again later.",
    },
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

export const sensitiveActionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,
    message: {
        message: "Too many requests. Try again later.",
    },
    standardHeaders: "draft-8",
    legacyHeaders: false,
});
