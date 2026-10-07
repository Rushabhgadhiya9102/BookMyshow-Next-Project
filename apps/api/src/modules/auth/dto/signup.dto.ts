import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import type { Role } from "@bookmyshow/database";

export class SignupDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  role?: Role | string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  preferredCity?: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}
