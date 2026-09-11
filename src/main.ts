import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>('API_PREFIX', 'api');
  const corsAllowlist = config.get<string>('CORS_ALLOWLIST', '').split(',').filter(Boolean);

  app.setGlobalPrefix(apiPrefix);
  app.use(helmet());
  app.use(cookieParser());
  // Express defaults to a 100kb body limit, too small for base64 avatar/logo uploads.
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));
  app.enableCors({
    credentials: true,
    origin: corsAllowlist.length > 0 ? corsAllowlist : true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  if (config.get<string>('SWAGGER_ENABLED', 'true') === 'true') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Workou API')
        .setDescription('Context-aware hiring matching API')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build()
    );
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  await app.listen(config.get<number>('PORT', 3001));
}

void bootstrap();

