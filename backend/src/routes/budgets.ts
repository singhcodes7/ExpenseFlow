import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.get("/budget", authenticateToken, async (req: any, res: any) => {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

    try {
        const result = await pool.query(
            `SELECT amount, month FROM budgets WHERE user_id = $1 AND month = $2`,
            [req.userId, month]
        );

        const budget = result.rows[0] ? result.rows[0].amount : 20000;
        res.json({ budget, month });
    } catch (error) {
        console.error("Error fetching budget:", error);
        res.status(500).json({ message: "Failed to fetch budget" });
    }
});

router.post("/budget", authenticateToken, async (req: any, res: any) => {
    const schema = z.object({
        amount: z.coerce.number().positive().finite(),
        month: z.string().regex(/^\d{4}-\d{2}$/),
    });

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid budget data",
            errors: parsed.error.issues,
        });
    }

    try {
        const { amount, month } = parsed.data;

        const result = await pool.query(
            `INSERT INTO budgets (user_id, amount, month)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, month)
             DO UPDATE SET amount = EXCLUDED.amount
             RETURNING amount, month`,
            [req.userId, amount, month]
        );

        res.json({ budget: result.rows[0] });
    } catch (error) {
        console.error("Error saving budget:", error);
        res.status(500).json({ message: "Failed to save budget" });
    }
});

export default router;