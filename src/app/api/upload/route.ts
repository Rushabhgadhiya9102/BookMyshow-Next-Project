import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import envSetup from "@/configs/dotenv";

  // ======================================= //
  // =========== CLOUDINARY CONFIGS ============= //
  // ======================================= //

cloudinary.config({
  cloud_name: envSetup.CLOUDINARY_NAME,
  api_key: envSetup.CLOUDINARY_API_KEY,
  api_secret: envSetup.CLOUDINARY_SECRET_KEY,
});

  // ======================================= //
  // =========== POST IMAGES OF MOVIES ============= //
  // ======================================= //

export const POST = async (req: Request) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    
    const uploadRes = await cloudinary.uploader.upload(dataURI, {
      folder: "movies",
    });

    return NextResponse.json({ url: uploadRes.secure_url });
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
};
