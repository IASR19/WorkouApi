import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { RecruiterProfile, RecruiterRole } from "../entities/recruiter-profile.entity";

@Injectable()
export class CompanyOwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(RecruiterProfile)
    private readonly profiles: Repository<RecruiterProfile>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.sub;

    if (!userId) {
      throw new ForbiddenException("Usuário não autenticado");
    }

    const profile = await this.profiles.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: { company: true },
    });

    if (!profile) {
      throw new ForbiddenException("Você não está vinculado a nenhuma empresa");
    }

    if (profile.companyRole !== RecruiterRole.Owner) {
      throw new ForbiddenException(
        "Apenas o responsável geral da empresa pode realizar operações administrativas",
      );
    }

    return true;
  }
}
