import { IsOptional, IsString } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  preferredCity?: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}
