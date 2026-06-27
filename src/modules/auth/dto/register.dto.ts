import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  // Recruiter-only fields (company registration)
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  @MinLength(14)
  companyCNPJ?: string;

  @IsOptional()
  @IsString()
  companyWebsite?: string;

  @IsOptional()
  @IsString()
  companyIndustry?: string;

  @IsOptional()
  @IsString()
  plan?: string;
}
