import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private isConfigured = false;

  constructor(private configService: ConfigService) {
    const cloudName =
      this.configService.get<string>("CLOUDINARY_NAME") ||
      process.env.CLOUDINARY_NAME;
    const apiKey =
      this.configService.get<string>("CLOUDINARY_API_KEY") ||
      process.env.CLOUDINARY_API_KEY;
    const apiSecret =
      this.configService.get<string>("CLOUDINARY_SECRET_KEY") ||
      process.env.CLOUDINARY_SECRET_KEY;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.isConfigured = true;
    } else {
      this.logger.warn(
        "Cloudinary credentials not provided. Running upload service in fallback mode."
      );
    }
  }

  /**
   * Section 77: Upload Media with randomized filenames and external storage
   */
  async uploadFile(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    // Double check MIME type safety
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid image MIME type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(", ")}`
      );
    }

    if (!this.isConfigured) {
      const base64 = file.buffer.toString("base64");
      const dataUri = `data:${file.mimetype};base64,${base64}`;
      return { url: dataUri };
    }

    const randomPublicId = `bms_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "movies",
          public_id: randomPublicId,
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) {
            this.logger.warn(
              "Cloudinary upload failed, falling back to base64 data URI",
              error
            );
            const base64 = file.buffer.toString("base64");
            const dataUri = `data:${file.mimetype};base64,${base64}`;
            return resolve({ url: dataUri });
          }
          resolve({ url: result.secure_url });
        }
      );
      uploadStream.end(file.buffer);
    });
  }
}
