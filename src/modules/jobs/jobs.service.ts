import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateJobDto } from "./dto/create-job.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import { Job, JobStatus } from "./entities/job.entity";
import { RecruiterProfile } from "../companies/entities/recruiter-profile.entity";
import { Company } from "../companies/entities/company.entity";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { paginate } from "../../common/dto/paginated-result";

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly jobs: Repository<Job>,
    @InjectRepository(RecruiterProfile)
    private readonly profiles: Repository<RecruiterProfile>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
  ) {}

  async findAll(userId: string | undefined, pagination: PaginationQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;
    const relations = { company: true, createdBy: { user: true } } as const;
    const order = { createdAt: "DESC" as const };

    let where: Record<string, unknown> | undefined;

    // Find recruiter profile to check role (only matters if a userId was provided)
    const profile = userId
      ? await this.profiles.findOne({
          where: { user: { id: userId }, isActive: true },
          relations: { company: true },
        })
      : null;

    if (profile) {
      // Owner sees all company jobs; manager sees only their own
      where =
        profile.companyRole === "owner"
          ? { company: { id: profile.company.id } }
          : { createdBy: { id: profile.id } };
    }

    const [items, total] = await this.jobs.findAndCount({
      where,
      order,
      relations,
      skip,
      take: limit,
    });

    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const job = await this.jobs.findOne({
      where: { id },
      relations: { company: true, createdBy: { user: true } },
    });
    if (!job) throw new NotFoundException("Vaga não encontrada");
    return job;
  }

  private async assertCanManageJob(userId: string, jobId: string) {
    const job = await this.jobs.findOne({
      where: { id: jobId },
      relations: { createdBy: true, company: true },
    });
    if (!job) throw new NotFoundException("Vaga não encontrada");

    const profile = await this.profiles.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: { company: true },
    });
    if (!profile || profile.company.id !== job.company?.id) {
      throw new ForbiddenException("Você não tem permissão para gerenciar esta vaga.");
    }

    const isOwner = profile.companyRole === "owner";
    const isJobCreator = job.createdBy?.id === profile.id;
    if (!isOwner && !isJobCreator) {
      throw new ForbiddenException("Você só pode gerenciar vagas que você criou.");
    }

    return job;
  }

  async update(id: string, userId: string, dto: UpdateJobDto) {
    const job = await this.assertCanManageJob(userId, id);
    Object.assign(job, dto);
    return this.jobs.save(job);
  }

  async setStatus(id: string, userId: string, status: JobStatus) {
    const job = await this.assertCanManageJob(userId, id);
    job.status = status;
    return this.jobs.save(job);
  }

  async remove(id: string, userId: string) {
    const job = await this.assertCanManageJob(userId, id);
    await this.jobs.softRemove(job);
    return { success: true };
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
