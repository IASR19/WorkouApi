import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { User, UserRole } from '../users/entities/user.entity';
import { BillingRecord, BillingType } from '../billing/entities/billing-record.entity';
import { Company, PLAN_CONFIG, PlanType } from './entities/company.entity';
import { RecruiterProfile, RecruiterRole } from './entities/recruiter-profile.entity';

interface CreateCompanyDto {
  name: string;
  document?: string;
  website?: string;
  industry?: string;
  plan?: PlanType;
  ownerId: string;
}

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(RecruiterProfile) private readonly profiles: Repository<RecruiterProfile>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(BillingRecord) private readonly billing: Repository<BillingRecord>
  ) {}

  findAll() {
    return this.companies.find({ order: { createdAt: 'DESC' } });
  }

  async createWithOwner(dto: CreateCompanyDto) {
    const plan = (dto.plan as PlanType) ?? PlanType.Essencial;
    const planCfg = PLAN_CONFIG[plan];

    const company = await this.companies.save(
      this.companies.create({
        name: dto.name,
        document: dto.document,
        website: dto.website,
        industry: dto.industry,
        plan,
        planStartedAt: new Date(),
        planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        seatsAllowed: planCfg.seats === -1 ? 9999 : planCfg.seats,
        jobsPerMonth: planCfg.jobsPerMonth === -1 ? 9999 : planCfg.jobsPerMonth,
        jobsPostedThisMonth: 0,
        lastJobResetAt: new Date(),
        ownerId: dto.ownerId
      })
    );

    const owner = await this.users.findOneByOrFail({ id: dto.ownerId });
    await this.profiles.save(
      this.profiles.create({ user: owner, company, companyRole: RecruiterRole.Owner, isActive: true })
    );

    return company;
  }

  async getMyCompany(userId: string) {
    const profile = await this.profiles.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: { company: true, user: true }
    });
    if (!profile) throw new NotFoundException('Nenhuma empresa associada a este usuário.');
    return profile.company;
  }

  async getMyProfile(userId: string) {
    const profile = await this.profiles.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: { company: true, user: true }
    });
    if (!profile) throw new NotFoundException('Perfil de recrutador não encontrado.');
    return profile;
  }

  async getSeats(userId: string) {
    const company = await this.getMyCompany(userId);
    return this.profiles.find({
      where: { company: { id: company.id } },
      relations: { user: true, company: true },
      order: { createdAt: 'ASC' }
    });
  }

  async addSeat(
    userId: string,
    dto: { name: string; email: string; password: string; cardLast4?: string }
  ) {
    const company = await this.getMyCompany(userId);
    const totalSeats = company.seatsAllowed + company.extraSeats;
    const currentSeats = await this.profiles.count({
      where: { company: { id: company.id }, isActive: true }
    });

    let chargeExtra = false;
    if (currentSeats >= totalSeats) {
      chargeExtra = true;
    }

    // Find or create user
    let manager = await this.users.findOne({ where: { email: dto.email } });
    if (manager) {
      const roles = manager.roles?.length ? manager.roles : [manager.role];
      if (!roles.includes(UserRole.Recruiter)) {
        manager.roles = [...roles, UserRole.Recruiter];
        await this.users.save(manager);
      }
    } else {
      manager = await this.users.save(
        this.users.create({
          name: dto.name,
          email: dto.email,
          passwordHash: await bcrypt.hash(dto.password, 10),
          role: UserRole.Recruiter,
          roles: [UserRole.Recruiter]
        })
      );
    }

    // Check not already in company
    const existing = await this.profiles.findOne({
      where: { user: { id: manager.id }, company: { id: company.id } }
    });
    if (existing) {
      if (existing.isActive) throw new ConflictException('Este usuário já é gestor desta empresa.');
      existing.isActive = true;
      await this.profiles.save(existing);
    } else {
      await this.profiles.save(
        this.profiles.create({ user: manager, company, companyRole: RecruiterRole.Manager, isActive: true })
      );
    }

    if (chargeExtra) {
      const planCfg = PLAN_CONFIG[company.plan ?? PlanType.Essencial];
      company.extraSeats += 1;
      await this.companies.save(company);
      await this.billing.save(
        this.billing.create({
          company,
          type: BillingType.ExtraSeat,
          amount: planCfg.extraSeatPrice,
          description: `Seat adicional — ${dto.email}`,
          status: 'authorized',
          cardLast4: dto.cardLast4,
          metadata: { managerEmail: dto.email }
        })
      );
    }

    return { success: true, chargedExtra: chargeExtra };
  }

  async removeSeat(userId: string, profileId: string) {
    const company = await this.getMyCompany(userId);
    const profile = await this.profiles.findOne({
      where: { id: profileId, company: { id: company.id } },
      relations: { user: true }
    });
    if (!profile) throw new NotFoundException('Gestor não encontrado.');
    if (profile.companyRole === RecruiterRole.Owner) {
      throw new BadRequestException('Não é possível remover o proprietário da empresa.');
    }
    profile.isActive = false;
    return this.profiles.save(profile);
  }

  async subscribeToPlan(
    userId: string,
    plan: PlanType,
    billingInfo: { cardNumber: string; cardName: string; cardExpiry: string; cardCvv: string }
  ) {
    const company = await this.getMyCompany(userId);
    const planCfg = PLAN_CONFIG[plan];

    company.plan = plan;
    company.planStartedAt = new Date();
    company.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    company.seatsAllowed = planCfg.seats === -1 ? 9999 : planCfg.seats;
    company.jobsPerMonth = planCfg.jobsPerMonth === -1 ? 9999 : planCfg.jobsPerMonth;
    company.extraSeats = 0;
    company.extraJobs = 0;
    await this.companies.save(company);

    const last4 = billingInfo.cardNumber.replace(/\s/g, '').slice(-4);
    await this.billing.save(
      this.billing.create({
        company,
        type: BillingType.Subscription,
        amount: planCfg.price,
        description: `Assinatura Workou ${planCfg.label} — mensal`,
        status: 'authorized',
        cardLast4: last4,
        metadata: { plan, cardName: billingInfo.cardName }
      })
    );

    return { success: true, company, plan: planCfg };
  }

  async buyExtraJob(userId: string, billingInfo: { cardLast4?: string }) {
    const company = await this.getMyCompany(userId);
    const planCfg = PLAN_CONFIG[company.plan ?? PlanType.Essencial];

    company.extraJobs += 1;
    await this.companies.save(company);

    await this.billing.save(
      this.billing.create({
        company,
        type: BillingType.ExtraJob,
        amount: planCfg.extraJobPrice,
        description: 'Vaga adicional avulsa',
        status: 'authorized',
        cardLast4: billingInfo.cardLast4,
        metadata: { plan: company.plan }
      })
    );

    return { success: true, chargedAmount: planCfg.extraJobPrice };
  }

  async getBillingRecords(userId: string) {
    const company = await this.getMyCompany(userId);
    return this.billing.find({
      where: { company: { id: company.id } },
      order: { createdAt: 'DESC' }
    });
  }
}
