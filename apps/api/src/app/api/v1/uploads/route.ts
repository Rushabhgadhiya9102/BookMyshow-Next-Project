import { NextResponse } from "next/server";
import cloudinary from "@/server/integrations/cloudinary";

  // ======================================= //
  // =========== CLOUDINARY CONFIGS ============= //
  // ======================================= //

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
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
};
