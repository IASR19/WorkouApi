import { Column, Entity, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Candidate } from '../../candidates/entities/candidate.entity';

export enum ResumeStatus {
  Uploaded = 'uploaded',
  Parsed = 'parsed',
  Failed = 'failed'
}

@Entity('resumes')
export class Resume extends BaseEntity {
  @Column({ name: 'file_name' })
  fileName!: string;

  @Column({ name: 'storage_url', nullable: true })
  storageUrl?: string;

  @Column({ type: 'enum', enum: ResumeStatus, default: ResumeStatus.Uploaded })
  status!: ResumeStatus;

  @Column({ name: 'parsed_summary', type: 'text', nullable: true })
  parsedSummary?: string;

  @Column({ name: 'parsed_payload', type: 'jsonb', nullable: true })
  parsedPayload?: Record<string, unknown>;

  @ManyToOne(() => Candidate)
  candidate!: Candidate;
}

