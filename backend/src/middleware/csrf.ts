import express from "express";

export const csrfProtection = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
): void => {
    return next();
};