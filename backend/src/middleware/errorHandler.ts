import express from "express";

export const errorHandler =     (
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
;
