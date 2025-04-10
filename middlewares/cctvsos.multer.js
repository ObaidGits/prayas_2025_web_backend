import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure folder exists
const folderPath = path.join('public', 'cctv_sos');
if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, folderPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const filename = `cctv_sos_${uniqueSuffix}${ext}`;
    req.savedFileName = filename; // Store it for access in controller
    cb(null, filename);
  }
});

export const uploadCCTVSOS = multer({ storage });
