import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateMatchDto } from './dto/create-match.dto';
import { DecisionDto } from './dto/decision.dto';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/current-user.decorator';

@ApiTags('matches')
@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  findAll() {
    return this.matchesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateMatchDto) {
    return this.matchesService.create(dto);
  }

  @Get('candidate')
  findCandidateQueue(@CurrentUser() user: UserPayload) {
    return this.matchesService.findCandidateQueue(user.sub);
  }

  @Get('recruiter/:jobId')
  findRecruiterQueue(@Param('jobId') jobId: string, @CurrentUser() user: UserPayload) {
    return this.matchesService.findRecruiterQueue(user.sub, jobId);
  }

  @Patch(':id/recruiter-decision')
  setRecruiterDecision(@Param('id') id: string, @Body() dto: DecisionDto) {
    return this.matchesService.setRecruiterDecision(id, dto.decision);
  }

  @Patch(':id/candidate-decision')
  setCandidateDecision(@Param('id') id: string, @Body() dto: DecisionDto) {
    return this.matchesService.setCandidateDecision(id, dto.decision);
  }

  @Post(':id/undo')
  undoLastDecision(@Param('id') id: string, @Body() dto: { role: 'recruiter' | 'candidate' }) {
    return this.matchesService.undoLastDecision(id, dto.role);
  }
}

