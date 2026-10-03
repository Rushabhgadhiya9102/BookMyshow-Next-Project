import { v2 as cloudinary } from "cloudinary";
import envSetup from "@/shared/lib/env";

cloudinary.config({
  cloud_name: envSetup.CLOUDINARY_NAME,
  api_key: envSetup.CLOUDINARY_API_KEY,
  api_secret: envSetup.CLOUDINARY_SECRET_KEY
});

export default cloudinary;
