import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}

