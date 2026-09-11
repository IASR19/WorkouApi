import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';

export enum UserRole {
  Admin = 'admin',
  Recruiter = 'recruiter',
  Candidate = 'candidate'
}

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column()
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  avatar?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.Candidate })
  role!: UserRole;

  // Multi-role support: a user can be both candidate and recruiter
  @Column({ type: 'text', array: true, default: '{}', name: 'roles' })
  roles!: UserRole[];
}
