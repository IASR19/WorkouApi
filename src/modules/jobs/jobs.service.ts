import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateJobDto } from "./dto/create-job.dto";
import { Job } from "./entities/job.entity";
import { RecruiterProfile } from "../companies/entities/recruiter-profile.entity";
import { Company } from "../companies/entities/company.entity";

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly jobs: Repository<Job>,
    @InjectRepository(RecruiterProfile)
    private readonly profiles: Repository<RecruiterProfile>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
  ) {}

  async findAll(userId?: string) {
    // If no userId, return all jobs (public endpoint)
    if (!userId) {
      return this.jobs.find({
        order: { createdAt: "DESC" },
        relations: { company: true, createdBy: { user: true } },
      });
    }

    // Find recruiter profile to check role
    const profile = await this.profiles.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: { company: true },
    });

    // If not a recruiter, return all jobs
    if (!profile) {
      return this.jobs.find({
        order: { createdAt: "DESC" },
        relations: { company: true, createdBy: { user: true } },
      });
    }

    // Owner sees all company jobs
    if (profile.companyRole === "owner") {
      return this.jobs.find({
        where: { company: { id: profile.company.id } },
        order: { createdAt: "DESC" },
        relations: { company: true, createdBy: { user: true } },
      });
    }

    // Manager sees only their own jobs
    return this.jobs.find({
      where: { createdBy: { id: profile.id } },
      order: { createdAt: "DESC" },
      relations: { company: true, createdBy: { user: true } },
    });
  }

  async create(dto: CreateJobDto, userId: string) {
    // Find recruiter profile
    const profile = await this.profiles.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: { company: true, user: true },
    });
    if (!profile) {
      throw new NotFoundException(
        "Você não está vinculado a nenhuma empresa como recrutador.",
      );
    }

    const company = profile.company;

    // Calculate total jobs posted by all managers
    const allProfiles = await this.profiles.find({
      where: { company: { id: company.id }, isActive: true },
    });
    const totalJobsPosted = allProfiles.reduce(
      (sum, p) => sum + p.jobsPostedThisMonth,
      0,
    );

    // Calculate total allowed (company limit + all extra jobs allocated)
    const totalExtraJobs = allProfiles.reduce(
      (sum, p) => sum + p.extraJobsAllowed,
      0,
    );
    const companyLimit =
      company.jobsPerMonth === 9999
        ? 9999
        : company.jobsPerMonth + totalExtraJobs;

    // Check company-wide limit
    if (totalJobsPosted >= companyLimit) {
      throw new BadRequestException(
        `Limite de vagas atingido (${totalJobsPosted}/${companyLimit}). Peça ao administrador para comprar vagas extras.`,
      );
    }

    // Check if this specific manager can post (must have at least 1 job available from their allocation or extra jobs)
    const managerLimit = profile.extraJobsAllowed;
    if (profile.jobsPostedThisMonth >= managerLimit && managerLimit > 0) {
      throw new BadRequestException(
        `Você não tem vagas disponíveis. Peça ao administrador para alocar uma vaga extra para você.`,
      );
    }

    // Create the job
    const job = await this.jobs.save(
      this.jobs.create({
        ...dto,
        niceToHaveSkills: dto.niceToHaveSkills ?? [],
        company,
        createdBy: profile,
      }),
    );

    // Increment manager's counter
    profile.jobsPostedThisMonth += 1;
    await this.profiles.save(profile);

    // Increment company's counter
    company.jobsPostedThisMonth += 1;
    await this.companies.save(company);

    return job;
  }
}
