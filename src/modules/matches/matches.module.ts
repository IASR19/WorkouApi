import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Candidate } from '../candidates/entities/candidate.entity';
import { Job } from '../jobs/entities/job.entity';
import { Match } from './entities/match.entity';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { Conversation } from '../conversations/entities/conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Job, Candidate, Conversation])],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService]
})
export class MatchesModule {}

