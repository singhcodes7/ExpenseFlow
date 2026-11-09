import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Example backend route snippet
router.get("/expenses", authenticateToken, async (req: any, res: any) => {
    try {
        const result = await pool.query(
            `SELECT id, name, amount, category, payment_mode, is_recurring, recurrence_interval, is_capital_expense, created_at 
             FROM expenses WHERE user_id = $1 ORDER BY created_at DESC`,
            [req.userId]
        );
        res.json({ expenses: result.rows });
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ message: "Failed to fetch expenses" });
    }
});

router.post("/expenses", authenticateToken, async (req: any, res: any) => {
    const schema = z.object({
        name: z.string().trim().min(1).max(100),
        amount: z.coerce.number().positive().finite(),
        category: z.string().trim().min(1).max(50),
        is_recurring: z.boolean().optional().default(false),
        recurrence_interval: z.enum(['weekly', 'monthly', 'yearly']).nullable().optional(),
        payment_mode: z.string().trim().min(1).max(50).optional().default('UPI'),
        is_capital_expense: z.boolean().optional().default(false),
    });

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid expense data",
            errors: parsed.error.issues,
        });
    }

    try {
        const { name, amount, category, is_recurring, recurrence_interval, payment_mode, is_capital_expense } = parsed.data;

        // Check if the category already exists for this user
        let categoryResult = await pool.query(
            `SELECT id
             FROM categories
             WHERE user_id = $1 AND name = $2`,
            [req.userId, category]
        );

        // If it doesn't exist (e.g. user typed a custom one), auto-create it
        if (categoryResult.rows.length === 0) {
            categoryResult = await pool.query(
                `INSERT INTO categories (user_id, name)
                 VALUES ($1, $2)
                 RETURNING id`,
                [req.userId, category]
            );
        }

        const result = await pool.query(
            `INSERT INTO expenses (user_id, name, amount, category, is_recurring, recurrence_interval, payment_mode, is_capital_expense)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, name, amount, category, is_recurring, recurrence_interval, payment_mode, is_capital_expense, created_at`,
            [req.userId, name, amount, category, is_recurring, recurrence_interval || null, payment_mode || 'UPI', is_capital_expense]
        );

        return res.status(201).json({
            expense: result.rows[0],
        });
    } catch (error) {
        console.error("Error creating expense:", error);
        return res.status(500).json({
            message: "Failed to create expense",
        });
    }
});
router.put("/expenses/:id", authenticateToken, async (req: any, res: any) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid expense ID",
        });
    }

    const schema = z.object({
        name: z.string().trim().min(1).max(255),
        amount: z.coerce.number().positive().finite(),
        category: z.string().trim().min(1).max(50),
        is_recurring: z.boolean().optional().default(false),
        recurrence_interval: z.enum(['weekly', 'monthly', 'yearly']).nullable().optional(),
        payment_mode: z.string().trim().min(1).max(50).optional().default('UPI'),
        is_capital_expense: z.boolean().optional().default(false),
        created_at: z.string().optional().nullable(),
    });

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid expense data",
            errors: parsed.error.issues,
        });
    }

    try {
        const { name, amount, category, is_recurring, recurrence_interval, payment_mode, is_capital_expense, created_at } = parsed.data;

        const categoryResult = await pool.query(
            `SELECT id FROM categories WHERE user_id = $1 AND name = $2`,
            [req.userId, category]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(400).json({
                message: "Invalid category. Please select one of your categories.",
            });
        }

        const result = await pool.query(
            `UPDATE expenses
             SET name = $1, amount = $2, category = $3, is_recurring = $4, recurrence_interval = $5, payment_mode = $6, is_capital_expense = $7, created_at = COALESCE($8, created_at)
             WHERE id = $9 AND user_id = $10
             RETURNING id, name, amount, category, is_recurring, recurrence_interval, payment_mode, is_capital_expense, created_at`,
            [name, amount, category, is_recurring, recurrence_interval || null, payment_mode || 'UPI', is_capital_expense, created_at || null, id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Expense not found",
            });
        }

        return res.json({ expense: result.rows[0] });
    } catch (error) {
        console.error("Error updating expense:", error);
        return res.status(500).json({
            message: "Failed to update expense",
        });
    }
});
router.delete("/expenses/:id", authenticateToken, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid expense ID",
        });
    }

    try {
        const result = await pool.query(
            `DELETE FROM expenses
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Expense not found",
            });
        }

        return res.json({
            message: "Expense deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting expense:", error);
        return res.status(500).json({
            message: "Failed to delete expense",
        });
    }
});

export default router;
