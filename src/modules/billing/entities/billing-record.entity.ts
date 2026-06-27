import { Column, Entity, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Company } from '../../companies/entities/company.entity';

export enum BillingType {
  Subscription = 'subscription',
  ExtraSeat = 'extra_seat',
  ExtraJob = 'extra_job',
  Upgrade = 'upgrade'
}

@Entity('billing_records')
export class BillingRecord extends BaseEntity {
  @ManyToOne(() => Company, { eager: true })
  company!: Company;

  @Column({ type: 'enum', enum: BillingType })
  type!: BillingType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column()
  description!: string;

  @Column({ default: 'authorized' })
  status!: string;

  @Column({ name: 'card_last4', nullable: true })
  cardLast4?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
