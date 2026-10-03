import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  durationMinutes?: number;

  @IsOptional()
  duration?: number;

  @IsOptional()
  releaseDate?: string | Date;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  certification?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  poster?: string;

  @IsOptional()
  @IsString()
  posterUrl?: string;

  @IsOptional()
  @IsString()
  backdropUrl?: string;

  @IsOptional()
  @IsString()
  trailerUrl?: string;

  @IsOptional()
  rating?: number;

  @IsOptional()
  @IsString()
  createdBy?: string;
}
