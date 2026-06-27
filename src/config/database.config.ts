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
    autoLoadEntities: true,
    synchronize: config.get<string>('DATABASE_SYNCHRONIZE') === 'true',
    migrations: ['dist/migrations/*.js'],
    ssl: config.get<string>('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false
  };
}

