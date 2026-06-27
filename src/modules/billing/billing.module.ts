import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BillingRecord } from './entities/billing-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BillingRecord])],
  exports: [TypeOrmModule]
})
export class BillingModule {}
