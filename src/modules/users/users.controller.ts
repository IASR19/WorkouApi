import { Body, Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

function toSafeUser(user: any) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query() pagination: PaginationQueryDto) {
    const result = await this.usersService.findAll(pagination);
    return { ...result, items: result.items.map(toSafeUser) };
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findMe(@CurrentUser() user: UserPayload) {
    return toSafeUser(await this.usersService.findById(user.sub));
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@CurrentUser() user: UserPayload, @Body() dto: UpdateUserDto) {
    return toSafeUser(await this.usersService.updateProfile(user.sub, dto));
  }
}
