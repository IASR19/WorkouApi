import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/current-user.decorator';
import { Candidate } from './entities/candidate.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('candidates')
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.candidatesService.findAll(pagination);
  }

  @Post()
  create(@Body() dto: CreateCandidateDto) {
    return this.candidatesService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMe(@CurrentUser() user: UserPayload) {
    return this.candidatesService.findByUserId(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<Candidate>, @CurrentUser() user: UserPayload) {
    return this.candidatesService.update(id, user.sub, dto);
  }
}

