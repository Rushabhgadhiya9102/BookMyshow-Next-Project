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

  async uploadFile(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    if (!this.isConfigured) {
      const base64 = file.buffer.toString("base64");
      const dataUri = `data:${file.mimetype};base64,${base64}`;
      return { url: dataUri };
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "movies" },
        (error, result) => {
          if (error || !result) {
            this.logger.error("Cloudinary upload failed", error);
            return reject(new BadRequestException("Image upload failed"));
          }
          resolve({ url: result.secure_url });
        }
      );
      uploadStream.end(file.buffer);
    });
  }
}
