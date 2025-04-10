import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.error("❌ No local file path provided to Cloudinary.");
      return null;
    }

    // console.log("📤 Uploading to Cloudinary from path:", localFilePath);

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("✅ Cloudinary upload success:", response.secure_url);

    fs.unlinkSync(localFilePath); // delete local file
    return response;
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error.message);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // cleanup
    }
    return null;
  }
};

export { uploadOnCloudinary };
