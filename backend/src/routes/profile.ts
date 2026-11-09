import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { pool } from "../db.js";
import { CLOUDINARY_ENABLED, avatarPublicId, upload, uploadAvatar } from "../lib/avatar.js";
import { authenticateToken } from "../middleware/auth.js";
import { updateProfileSchema } from "../schemas.js";

const router = Router();

router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const userId = (req as any).userId;

        const result = await pool.query(
            `SELECT id, name, email, created_at, profile_picture
FROM users
WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Profile error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

//=============profile-update route===========

router.patch("/profile", authenticateToken, async (req, res) => {
    try {
        const parsed = updateProfileSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                message: "Invalid input. Only name can be updated.",
            });
        }

        const userId = (req as any).userId;
        const { name } = parsed.data;

        const result = await pool.query(
            `UPDATE users
SET name = $1
WHERE id = $2
RETURNING id, name, email, created_at, profile_picture`,
            [name, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message: "Profile updated successfully",
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Profile update error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

router.post(
    "/profile-picture",
    authenticateToken,
    (req, res, next) => {
        upload.single("profilePicture")(req, res, (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === "LIMIT_FILE_SIZE") {
                        return res.status(413).json({
                            message: "Image must be 2 MB or smaller.",
                        });
                    }

                    return res.status(400).json({
                        message: "Invalid upload.",
                    });
                }

                return res.status(400).json({
                    message: err.message || "Image upload failed.",
                });
            }

            next();
        });
    },
    async (req, res) => {
        try {
            if (!CLOUDINARY_ENABLED) {
                return res.status(503).json({
                    message: "Image uploads are not configured on this server.",
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    message: "Please select an image.",
                });
            }

            const userId = (req as any).userId;
            const pictureUrl = await uploadAvatar(req.file.buffer, userId);

            const result = await pool.query(
                `UPDATE users
                 SET profile_picture = $1
                 WHERE id = $2
                 RETURNING id, name, email, created_at, profile_picture`,
                [pictureUrl, userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "User not found.",
                });
            }

            return res.status(200).json({
                message: "Profile picture updated successfully.",
                user: result.rows[0],
            });
        } catch (error) {
            console.error("Profile picture upload error:", error);

            return res.status(500).json({
                message: "Internal server error.",
            });
        }
    }
);

router.delete("/profile-picture", authenticateToken, async (req, res) => {
    try {
        const userId = (req as any).userId;

        const result = await pool.query(
            `UPDATE users
             SET profile_picture = NULL
             WHERE id = $1
             RETURNING id, name, email, created_at, profile_picture`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        // Best effort: the database is already updated
        if (CLOUDINARY_ENABLED) {
            cloudinary.uploader
                .destroy(avatarPublicId(userId), { invalidate: true })
                .catch((error) => {
                    console.error("Cloudinary delete error:", error);
                });
        }

        return res.status(200).json({
            message: "Profile picture removed successfully.",
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Profile picture removal error:", error);

        return res.status(500).json({
            message: "Internal server error.",
        });
    }
});

export default router;