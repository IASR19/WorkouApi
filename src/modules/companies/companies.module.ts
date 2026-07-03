import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { User } from "../users/entities/user.entity";
import { BillingRecord } from "../billing/entities/billing-record.entity";
import { CompaniesController } from "./companies.controller";
import { CompaniesService } from "./companies.service";
import { Company } from "./entities/company.entity";
import { RecruiterProfile } from "./entities/recruiter-profile.entity";
import { CompanyOwnerGuard } from "./guards/company-owner.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, RecruiterProfile, User, BillingRecord]),
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService, CompanyOwnerGuard],
  exports: [CompaniesService, TypeOrmModule],
})
export class CompaniesModule {}
