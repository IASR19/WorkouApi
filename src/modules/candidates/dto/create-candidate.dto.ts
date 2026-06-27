import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  headline!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  workModel?: string;

  @IsInt()
  yearsExperience!: number;

  @IsArray()
  @IsString({ each: true })
  skills!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  links?: string[];

  @IsOptional()
  @IsInt()
  desiredSalary?: number;
}

