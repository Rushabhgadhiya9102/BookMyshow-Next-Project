import { IsOptional, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class AnalyticsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 7;
}
