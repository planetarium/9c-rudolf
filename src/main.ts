import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import * as dotenv from 'dotenv';

import Decimal from 'decimal.js';
import { json } from 'express';

// This can be a problem if the number of digits in amount exceeds 9e+14.
// For details, you can see https://mikemcl.github.io/decimal.js/#toExpPos
Decimal.set({ toExpPos: 900000000000000 });

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.use(
    json({
      limit: '1mb',
    }),
  );

  await app.listen(3000);
}
bootstrap();
