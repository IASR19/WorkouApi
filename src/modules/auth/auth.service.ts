import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";

import { UsersService } from "../users/users.service";
import { CandidatesService } from "../candidates/candidates.service";
import { CompaniesService } from "../companies/companies.service";
import { UserRole } from "../users/entities/user.entity";
import { PlanType } from "../companies/entities/company.entity";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly candidatesService: CandidatesService,
    private readonly companiesService: CompaniesService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("E-mail ou senha incorretos");
    }

    const availableRoles = this.usersService.getAvailableRoles(user);

    if (dto.role) {
      if (!availableRoles.includes(dto.role)) {
        throw new UnauthorizedException(
          `Você não tem uma conta de ${dto.role}. Faça o cadastro primeiro.`,
        );
      }
      return this.buildAuthResponse(user, dto.role);
    }

    if (availableRoles.length > 1) {
      return { requiresRoleSelection: true, availableRoles };
    }

    return this.buildAuthResponse(user, availableRoles[0]);
  }

  async register(dto: RegisterDto) {
    // Validate recruiter data BEFORE creating user
    if (dto.role === UserRole.Recruiter) {
      if (!dto.companyName)
        throw new BadRequestException(
          "Nome da empresa é obrigatório para recrutadores.",
        );
      if (!dto.companyCNPJ)
        throw new BadRequestException(
          "CNPJ é obrigatório para cadastro de empresa.",
        );
    }

    let user = await this.usersService.findByEmail(dto.email);

    if (user) {
      const existing = this.usersService.getAvailableRoles(user);
      if (existing.includes(dto.role as UserRole)) {
        throw new ConflictException(
          `Você já tem uma conta de ${dto.role === "candidate" ? "candidato" : "recrutador"} com este e-mail.`,
        );
      }
      if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
        throw new UnauthorizedException("Senha incorreta para este e-mail.");
      }
      user = await this.usersService.addRole(user.id, dto.role as UserRole);
    } else {
      user = await this.usersService.create({
        name: dto.name,
        email: dto.email,
        password: dto.password,
        role: dto.role as UserRole,
      });
    }

    if (dto.role === UserRole.Candidate) {
      await this.candidatesService.createEmptyForUser(user.id);
    }

    if (dto.role === UserRole.Recruiter) {
      await this.companiesService.createWithOwner({
        name: dto.companyName!,
        document: dto.companyCNPJ!,
        website: dto.companyWebsite,
        industry: dto.companyIndustry,
        plan: (dto.plan as PlanType) ?? PlanType.Essencial,
        ownerId: user.id,
      });
    }

    return this.buildAuthResponse(user, dto.role as UserRole);
  }

  private async buildAuthResponse(user: any, role: UserRole) {
    return {
      accessToken: await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
        role,
      }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role,
        availableRoles: this.usersService.getAvailableRoles(user),
      },
    };
  }
}
