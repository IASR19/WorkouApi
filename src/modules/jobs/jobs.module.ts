import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Job } from "./entities/job.entity";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";
import { RecruiterProfile } from "../companies/entities/recruiter-profile.entity";
import { Company } from "../companies/entities/company.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Job, RecruiterProfile, Company])],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
