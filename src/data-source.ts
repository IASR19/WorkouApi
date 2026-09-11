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
  // Raw SQL inside migrations (e.g. `CREATE TABLE "users" (...)`) is not schema-qualified
  // and relies on the connection's search_path to land in the right place. Postgres
  // defaults search_path to "$user", public — which only resolved to "workoudev" locally
  // by coincidence (the local DB user happens to be named "workoudev"). Setting it
  // explicitly here makes migrations land in the right schema in every environment,
  // regardless of which DB user runs them. "public" stays as a fallback so unqualified
  // calls to uuid_generate_v4() (created by the uuid-ossp extension in "public") keep resolving.
  extra: { options: '-c search_path=workoudev,public' },
  entities: ['src/modules/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false
});

