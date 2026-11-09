import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

const DEFAULT_EXPENSE_CATEGORIES = [
    "Food",
    "Transport",
    "Housing",
    "Utilities",
    "Shopping",
    "Health",
    "Entertainment",
    "Education"
];

router.get("/categories", authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;

        // Seed default expense categories if the user has none
        await pool.query(
            `INSERT INTO categories (user_id, name)
             SELECT $1, category_name
             FROM unnest($2::text[]) AS category_name
             ON CONFLICT (user_id, name) DO NOTHING`,
            [userId, DEFAULT_EXPENSE_CATEGORIES]
        );

        const result = await pool.query(
            `SELECT id, name
             FROM categories
             WHERE user_id = $1
             ORDER BY name ASC`,
            [userId]
        );

        return res.json({ categories: result.rows });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({
            message: "Failed to fetch categories",
        });
    }
});

router.post("/categories", authenticateToken, async (req, res) => {
    const schema = z.object({
        name: z.string().trim().min(1).max(50),
    });

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            message: "Category name must be between 1 and 50 characters",
        });
    }

    try {
        const name = parsed.data.name;

        const result = await pool.query(
            `INSERT INTO categories (user_id, name)
             VALUES ($1, $2)
             ON CONFLICT (user_id, name) DO NOTHING
             RETURNING id, name`,
            [req.userId, name]
        );

        if (result.rows.length === 0) {
            return res.status(409).json({
                message: "You already have this category",
            });
        }

        return res.status(201).json({
            category: result.rows[0],
        });
    } catch (error) {
        console.error("Error creating category:", error);
        return res.status(500).json({
            message: "Failed to create category",
        });
    }
});

export default router;