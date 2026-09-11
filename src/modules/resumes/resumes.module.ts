import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Candidate } from '../candidates/entities/candidate.entity';
import { Resume } from './entities/resume.entity';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { CandidatesModule } from '../candidates/candidates.module';
import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [TypeOrmModule.forFeature([Resume, Candidate]), CandidatesModule, MatchesModule],
  controllers: [ResumesController],
  providers: [ResumesService]
})
export class ResumesModule {}


