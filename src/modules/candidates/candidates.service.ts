import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Candidate } from './entities/candidate.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';

@Injectable()
export class CandidatesService {
  constructor(@InjectRepository(Candidate) private readonly candidates: Repository<Candidate>) {}

  findAll() {
    return this.candidates.find({ order: { createdAt: 'DESC' }, relations: { user: true } });
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

  async update(id: string, dto: Partial<Omit<Candidate, 'parsedPayload'>>) {
    await this.candidates.update(id, dto as any);
    return this.candidates.findOne({ where: { id }, relations: { user: true } });
  }
}

