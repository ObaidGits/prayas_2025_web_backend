// utils/userMulterConfig.js
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure the target directory exists
const uploadPath = path.resolve("public/user_imgs");
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `user-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};

export const userMulter = multer({ storage, fileFilter });
