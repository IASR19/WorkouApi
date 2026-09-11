import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function createBaseDbOptions(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: config.get<string>('DATABASE_HOST', 'localhost'),
    port: config.get<number>('DATABASE_PORT', 5432),
    username: config.get<string>('DATABASE_USER', 'workoudev'),
    password: config.get<string>('DATABASE_PASSWORD', 'workoudev2026'),
    database: config.get<string>('DATABASE_NAME', 'workou-dev'),
    schema: 'workoudev',
    // See src/data-source.ts for why this is needed: without it, raw SQL (migrations)
    // falls back to Postgres' default search_path, which only resolves to "workoudev"
    // when the DB user happens to be named that — true locally, not in every environment.
    extra: { options: '-c search_path=workoudev,public' },
    autoLoadEntities: true,
    synchronize: config.get<string>('DATABASE_SYNCHRONIZE') === 'true',
    migrations: ['dist/migrations/*.js'],
    ssl: config.get<string>('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false
  };
}

