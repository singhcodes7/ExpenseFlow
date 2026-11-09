import { Router } from "express";
import { authenticateToken, authorizeAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/admin", authenticateToken, authorizeAdmin, (req, res) => {
    res.json({
        message: "Welcome, admin!",
    });
});

export default router;
