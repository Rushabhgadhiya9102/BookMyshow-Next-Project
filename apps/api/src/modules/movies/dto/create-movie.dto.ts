import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  synopsis?: string;

  @IsOptional()
  durationMinutes?: number;

  @IsOptional()
  duration?: number;

  @IsOptional()
  runtime?: any;

  @IsOptional()
  releaseDate?: string | Date;

  @IsOptional()
  language?: string | string[];

  @IsOptional()
  genres?: string | string[];

  @IsOptional()
  @IsString()
  certification?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  poster?: string;

  @IsOptional()
  @IsString()
  posterUrl?: string;

  @IsOptional()
  @IsString()
  banners?: string;

  @IsOptional()
  @IsString()
  backdropUrl?: string;

  @IsOptional()
  @IsString()
  trailerUrl?: string;

  @IsOptional()
  rating?: any;

  @IsOptional()
  cast?: any[];

  @IsOptional()
  cinemas?: any[];

  @IsOptional()
  @IsString()
  createdBy?: string;
}
