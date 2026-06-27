import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Candidate } from '../candidates/entities/candidate.entity';
import { Resume } from './entities/resume.entity';
import { Job } from '../jobs/entities/job.entity';
import { Match } from '../matches/entities/match.entity';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { CandidatesModule } from '../candidates/candidates.module';

@Module({
  imports: [TypeOrmModule.forFeature([Resume, Candidate, Job, Match]), CandidatesModule],
  controllers: [ResumesController],
  providers: [ResumesService]
})
export class ResumesModule {}


