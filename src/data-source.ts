import 'reflect-metadata';
import 'dotenv/config';

import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'workoudev',
  password: process.env.DATABASE_PASSWORD ?? 'workoudev2026',
  database: process.env.DATABASE_NAME ?? 'workou-dev',
  schema: 'workoudev',
  entities: ['src/modules/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false
});

