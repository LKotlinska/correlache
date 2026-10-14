import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Behind Heroku's router; without this every client shares the proxy's IP and rate limiting hits everyone at once.
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  // whitelist strips unknown fields; forbidNonWhitelisted rejects them with a 400
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
