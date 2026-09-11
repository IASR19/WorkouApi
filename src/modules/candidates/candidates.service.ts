import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Candidate } from './entities/candidate.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { paginate } from '../../common/dto/paginated-result';

@Injectable()
export class CandidatesService {
  constructor(@InjectRepository(Candidate) private readonly candidates: Repository<Candidate>) {}

  async findAll(pagination: PaginationQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const [items, total] = await this.candidates.findAndCount({
      order: { createdAt: 'DESC' },
      relations: { user: true },
      skip: (page - 1) * limit,
      take: limit
    });
    return paginate(items, total, page, limit);
  }

  create(dto: CreateCandidateDto) {
    return this.candidates.save(this.candidates.create({ ...dto, links: dto.links ?? [] }));
  }

  findByUserId(userId: string) {
    return this.candidates.findOne({ where: { user: { id: userId } }, relations: { user: true } });
  }

  createEmptyForUser(userId: string) {
    return this.candidates.save(
      this.candidates.create({
        headline: 'Profissional em busca de oportunidades',
        yearsExperience: 0,
        skills: [],
        links: [],
        user: { id: userId } as any
      })
    );
  }

  async update(id: string, requesterId: string, dto: Partial<Omit<Candidate, 'parsedPayload'>>) {
    const candidate = await this.candidates.findOne({ where: { id }, relations: { user: true } });
    if (!candidate) throw new NotFoundException('Candidato não encontrado');
    if (candidate.user?.id !== requesterId) {
      throw new ForbiddenException('Você só pode editar o seu próprio perfil.');
    }

    await this.candidates.update(id, dto as any);
    return this.candidates.findOne({ where: { id }, relations: { user: true } });
  }
}

