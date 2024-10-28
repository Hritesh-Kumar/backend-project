import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const uploadInCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("file has been uploaded");

    return response;
  } catch (error) {
    fs.unlink(localFilePath);
    return null;
  }
};

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});
