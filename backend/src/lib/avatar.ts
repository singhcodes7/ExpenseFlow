import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// ==================== PROFILE PICTURES (Cloudinary) ====================
// Set CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
// The Cloudinary SDK reads it automatically.

export const CLOUDINARY_ENABLED = Boolean(process.env.CLOUDINARY_URL);
export const AVATAR_FOLDER = "expenseflow/avatars";
export const avatarPublicId = (userId: number) => `${AVATAR_FOLDER}/user_${userId}`;

// Keep the file in memory, then stream it to Cloudinary
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024, // 2 MB
        files: 1,
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only JPG, PNG, and WEBP images are allowed"));
        }

        cb(null, true);
    },
});

// One picture per user: uploading again overwrites the previous one
export const uploadAvatar = (buffer: Buffer, userId: number) =>
    new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                public_id: avatarPublicId(userId),
                overwrite: true,
                invalidate: true,
                resource_type: "image",
                transformation: [
                    { width: 400, height: 400, crop: "fill", gravity: "auto" },
                ],
            },
            (error, result) => {
                if (error || !result) {
                    return reject(error ?? new Error("Upload failed"));
                }
                resolve(result.secure_url);
            }
        );

        stream.end(buffer);
    });
