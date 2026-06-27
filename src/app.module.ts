import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { createBaseDbOptions } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { HealthModule } from './modules/health/health.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MatchesModule } from './modules/matches/matches.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createBaseDbOptions
    }),
    AuthModule,
    UsersModule,
    BillingModule,
    CompaniesModule,
    JobsModule,
    CandidatesModule,
    ResumesModule,
    MatchesModule,
    ConversationsModule,
    HealthModule
  ]
})
export class AppModule {}
