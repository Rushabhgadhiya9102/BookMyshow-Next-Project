import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadsService } from "./uploads.service";
import { Public } from "@/common/decorators/public.decorator";

@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * Section 77: Upload Security
   * - Max size 10MB
   * - MIME & extension validation (jpeg, png, webp, avif)
   */
  @Public()
  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpeg|jpg|png|webp|avif)$/i }),
        ],
        fileIsRequired: true,
      })
    )
    file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }
    return this.uploadsService.uploadFile(file);
  }
}
