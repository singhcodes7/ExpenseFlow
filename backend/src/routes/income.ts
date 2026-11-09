import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

const DEFAULT_INCOME_CATEGORIES = [
    "Salary",
    "Freelancing",
    "Business",
    "Investments",
    "Rental Income",
    "Gifts",
    "Other",
];

// Fetch income categories
router.get("/income-categories", authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;

        // Seed default categories if the user has none.
        await pool.query(
            `INSERT INTO income_categories (user_id, name)
             SELECT $1, category_name
             FROM unnest($2::text[]) AS category_name
             ON CONFLICT (user_id, name) DO NOTHING`,
            [userId, DEFAULT_INCOME_CATEGORIES]
        );

        const result = await pool.query(
            `SELECT id, name
             FROM income_categories
             WHERE user_id = $1
             ORDER BY name ASC`,
            [userId]
        );

        return res.json({ categories: result.rows });
    } catch (error) {
        console.error("Error fetching income categories:", error);
        return res.status(500).json({
            message: "Failed to fetch income categories",
        });
    }
});

// Create income category
router.post("/income", authenticateToken, async (req: any, res: any) => {
    const schema = z.object({
        name: z.string().trim().min(1).max(255),
        amount: z.coerce.number().positive().finite(),
        category: z.string().trim().min(1).max(50),
    });

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid income data",
            errors: parsed.error.issues,
        });
    }

    try {
        const { name, amount, category } = parsed.data;

        // Check if category exists for this user
        let categoryResult = await pool.query(
            `SELECT id FROM categories WHERE user_id = $1 AND name = $2`,
            [req.userId, category]
        );

        // If it's a new custom income category, create it automatically
        if (categoryResult.rows.length === 0) {
            categoryResult = await pool.query(
                `INSERT INTO categories (user_id, name) VALUES ($1, $2) RETURNING id`,
                [req.userId, category]
            );
        }

        const result = await pool.query(
            `INSERT INTO income (user_id, name, amount, category)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, amount, category, created_at`,
            [req.userId, name, amount, category]
        );

        return res.status(201).json({
            income: result.rows[0],
        });
    } catch (error) {
        console.error("Error creating income:", error);
        return res.status(500).json({
            message: "Failed to create income",
        });
    }
});
// Delete income category
router.delete("/income-categories/:id", authenticateToken, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid category ID",
        });
    }

    try {
        const result = await pool.query(
            `DELETE FROM income_categories
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Income category not found",
            });
        }

        return res.json({
            message: "Income category deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting income category:", error);
        return res.status(500).json({
            message: "Failed to delete income category",
        });
    }
});



const incomeSchema = z.object({
    name: z.string().trim().min(1).max(255),
    amount: z.coerce.number()
        .positive()
        .finite()
        .max(9999999999.99),
    category: z.string().trim().min(1).max(50),
});

// GET all income records
router.get("/income", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, amount, category, created_at
             FROM income
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [req.userId]
        );

        return res.json({ income: result.rows });
    } catch (error) {
        console.error("Error fetching income:", error);
        return res.status(500).json({
            message: "Failed to fetch income",
        });
    }
});

// ADD income
router.post("/income", authenticateToken, async (req, res) => {
    const parsed = incomeSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid income data",
            errors: parsed.error.issues,
        });
    }

    try {
        const { name, amount, category } = parsed.data;

        // Ensure category belongs to the logged-in user.
        const categoryResult = await pool.query(
            `SELECT id
             FROM income_categories
             WHERE user_id = $1 AND name = $2`,
            [req.userId, category]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(400).json({
                message: "Invalid income category",
            });
        }

        const result = await pool.query(
            `INSERT INTO income (user_id, name, amount, category)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, amount, category, created_at`,
            [req.userId, name, amount, category]
        );

        return res.status(201).json({
            message: "Income added successfully",
            income: result.rows[0],
        });
    } catch (error) {
        console.error("Error adding income:", error);
        return res.status(500).json({
            message: "Failed to add income",
        });
    }
});

// UPDATE income
router.put("/income/:id", authenticateToken, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid income ID",
        });
    }

    const parsed = incomeSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid income data",
            errors: parsed.error.issues,
        });
    }

    try {
        const { name, amount, category } = parsed.data;

        const categoryResult = await pool.query(
            `SELECT id
             FROM income_categories
             WHERE user_id = $1 AND name = $2`,
            [req.userId, category]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(400).json({
                message: "Invalid income category",
            });
        }

        const result = await pool.query(
            `UPDATE income
             SET name = $1, amount = $2, category = $3
             WHERE id = $4 AND user_id = $5
             RETURNING id, name, amount, category, created_at`,
            [name, amount, category, id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Income record not found",
            });
        }

        return res.json({
            message: "Income updated successfully",
            income: result.rows[0],
        });
    } catch (error) {
        console.error("Error updating income:", error);
        return res.status(500).json({
            message: "Failed to update income",
        });
    }
});

// DELETE income
router.delete("/income/:id", authenticateToken, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid income ID",
        });
    }

    try {
        const result = await pool.query(
            `DELETE FROM income
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Income record not found",
            });
        }

        return res.json({
            message: "Income deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting income:", error);
        return res.status(500).json({
            message: "Failed to delete income",
        });
    }
});


router.get("/income/summary", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                COALESCE(SUM(amount), 0) AS total_income,

                COALESCE(
                    SUM(amount) FILTER (
                        WHERE created_at >= DATE_TRUNC('month', NOW())
                        AND created_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
                    ),
                    0
                ) AS monthly_income,

                COUNT(*) AS transaction_count

             FROM income
             WHERE user_id = $1`,
            [req.userId]
        );

        const categoryResult = await pool.query(
            `SELECT
                category,
                SUM(amount) AS total
             FROM income
             WHERE user_id = $1
             GROUP BY category
             ORDER BY total DESC`,
            [req.userId]
        );

        return res.json({
            summary: result.rows[0],
            categoryBreakdown: categoryResult.rows,
        });
    } catch (error) {
        console.error("Error fetching income summary:", error);

        return res.status(500).json({
            message: "Failed to fetch income summary",
        });
    }
});

export default router;
