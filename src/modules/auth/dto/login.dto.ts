import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

import { UserRole } from '../../users/entities/user.entity';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
