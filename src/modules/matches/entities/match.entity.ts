import { Column, Entity, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Job } from '../../jobs/entities/job.entity';

export enum MatchDecision {
  Pending = 'pending',
  Approved = 'approved',
  Skipped = 'skipped'
}

@Entity('matches')
export class Match extends BaseEntity {
  @Column({ type: 'int' })
  score!: number;

  @Column({ name: 'score_reason', type: 'text', nullable: true })
  scoreReason?: string;

  @Column({ name: 'recruiter_decision', type: 'enum', enum: MatchDecision, default: MatchDecision.Pending })
  recruiterDecision!: MatchDecision;

  @Column({ name: 'candidate_decision', type: 'enum', enum: MatchDecision, default: MatchDecision.Pending })
  candidateDecision!: MatchDecision;

  @Column({ name: 'is_mutual', default: false })
  isMutual!: boolean;

  @ManyToOne(() => Job)
  job!: Job;

  @ManyToOne(() => Candidate)
  candidate!: Candidate;
}

