import { IsOptional, IsString } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  industry?: string;
}

