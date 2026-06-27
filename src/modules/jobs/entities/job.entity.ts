import { Column, Entity, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Company } from '../../companies/entities/company.entity';

export enum JobStatus {
  Draft = 'draft',
  Open = 'open',
  Paused = 'paused',
  Closed = 'closed'
}

@Entity('jobs')
export class Job extends BaseEntity {
  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', array: true, default: '{}' })
  requiredSkills!: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  niceToHaveSkills!: string[];

  @Column({ nullable: true })
  workModel?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  seniority?: string;

  @Column({ name: 'salary_min', type: 'int', nullable: true })
  salaryMin?: number;

  @Column({ name: 'salary_max', type: 'int', nullable: true })
  salaryMax?: number;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.Open })
  status!: JobStatus;

  @ManyToOne(() => Company, { nullable: true })
  company?: Company;
}

