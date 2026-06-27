import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateJobDto } from './dto/create-job.dto';
import { Job } from './entities/job.entity';

@Injectable()
export class JobsService {
  constructor(@InjectRepository(Job) private readonly jobs: Repository<Job>) {}

  findAll() {
    return this.jobs.find({ order: { createdAt: 'DESC' }, relations: { company: true } });
  }

  create(dto: CreateJobDto) {
    return this.jobs.save(this.jobs.create({ ...dto, niceToHaveSkills: dto.niceToHaveSkills ?? [] }));
  }
}

