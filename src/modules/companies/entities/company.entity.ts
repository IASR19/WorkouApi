import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';

export enum PlanType {
  Essencial = 'essencial',
  Pro = 'pro',
  Business = 'business',
  Enterprise = 'enterprise'
}

// Seats are always unlimited (no longer a billing axis — charging per RH login
// discouraged the whole team from using the tool). The only billing axis is the
// volume of jobs posted per month. Enterprise has no published fixed price: it's
// negotiated with sales (see `custom` below) and `price` is `null` for it.
export const PLAN_CONFIG: Record<PlanType, {
  label: string;
  price: number | null;
  seats: number;
  jobsPerMonth: number;
  extraSeatPrice: number;
  extraJobPrice: number;
  description: string;
  highlight?: boolean;
  custom?: boolean;
}> = {
  [PlanType.Essencial]: {
    label: 'Essencial',
    price: 299,
    seats: -1,
    jobsPerMonth: 3,
    extraSeatPrice: 0,
    extraJobPrice: 49,
    description: 'Para pequenas empresas que estão começando no recrutamento digital.'
  },
  [PlanType.Pro]: {
    label: 'Pro',
    price: 699,
    seats: -1,
    jobsPerMonth: 10,
    extraSeatPrice: 0,
    extraJobPrice: 39,
    description: 'Ideal para times de RH em crescimento com múltiplas vagas simultâneas.',
    highlight: true
  },
  [PlanType.Business]: {
    label: 'Business',
    price: 1499,
    seats: -1,
    jobsPerMonth: 30,
    extraSeatPrice: 0,
    extraJobPrice: 29,
    description: 'Para empresas com contratação constante e time dedicado de recrutamento.'
  },
  [PlanType.Enterprise]: {
    label: 'Enterprise',
    price: null,
    seats: -1, // unlimited
    jobsPerMonth: -1, // unlimited
    extraSeatPrice: 0,
    extraJobPrice: 0,
    description: 'Solução sob medida para grandes corporações — negociado com o time comercial.',
    custom: true
  }
};

@Entity('companies')
export class Company extends BaseEntity {
  @Column()
  name!: string;

  @Index({ unique: true })
  @Column({ nullable: true })
  document?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  industry?: string;

  @Column({ type: 'text', nullable: true })
  logo?: string;

  @Column({ type: 'enum', enum: PlanType, nullable: true })
  plan?: PlanType;

  @Column({ name: 'plan_started_at', nullable: true })
  planStartedAt?: Date;

  @Column({ name: 'plan_expires_at', nullable: true })
  planExpiresAt?: Date;

  @Column({ name: 'seats_allowed', default: 0 })
  seatsAllowed!: number;

  @Column({ name: 'extra_seats', default: 0 })
  extraSeats!: number;

  @Column({ name: 'jobs_per_month', default: 0 })
  jobsPerMonth!: number;

  @Column({ name: 'jobs_posted_this_month', default: 0 })
  jobsPostedThisMonth!: number;

  @Column({ name: 'extra_jobs', default: 0 })
  extraJobs!: number;

  @Column({ name: 'last_job_reset_at', nullable: true })
  lastJobResetAt?: Date;

  @Column({ name: 'owner_id', nullable: true })
  ownerId?: string;
}
