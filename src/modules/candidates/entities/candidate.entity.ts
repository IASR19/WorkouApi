import { Column, Entity, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('candidates')
export class Candidate extends BaseEntity {
  @Column()
  headline!: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ name: 'work_model', nullable: true })
  workModel?: string;

  @Column({ name: 'years_experience', type: 'int', default: 0 })
  yearsExperience!: number;

  @Column({ type: 'text', array: true, default: '{}' })
  skills!: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  links!: string[];

  @Column({ name: 'desired_salary', type: 'int', nullable: true })
  desiredSalary?: number;

  @Column({ name: 'parsed_payload', type: 'jsonb', nullable: true })
  parsedPayload?: Record<string, unknown>;

  @ManyToOne(() => User, { nullable: true })
  user?: User;
}

