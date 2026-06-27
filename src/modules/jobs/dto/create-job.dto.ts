import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateJobDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsArray()
  @IsString({ each: true })
  requiredSkills!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  niceToHaveSkills?: string[];

  @IsOptional()
  @IsString()
  workModel?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  seniority?: string;

  @IsOptional()
  @IsInt()
  salaryMin?: number;

  @IsOptional()
  @IsInt()
  salaryMax?: number;
}

