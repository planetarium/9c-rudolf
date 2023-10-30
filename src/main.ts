// eslint-disable @typescript-eslint/no-var-requires

import * as dotenv from 'dotenv';
import esm_bypass_global from './esm_bypass_global';

async function bootstrap() {
  dotenv.config();

  esm_bypass_global['@planetarium/tx'] = await eval(
    'import("@planetarium/tx")',
  );
  esm_bypass_global['@planetarium/account'] = await eval(
    'import("@planetarium/account")',
  );
  esm_bypass_global['@planetarium/account-aws-kms'] = await eval(
    'import("@planetarium/account-aws-kms")',
  );

  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('./app.module');
  const { ValidationPipe } = require('@nestjs/common');
  const { HttpResponseMiddleware } = require('./http-response.middleware');

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  const httpResponseMiddleware = app.get(HttpResponseMiddleware);
  app.use(httpResponseMiddleware.use.bind(httpResponseMiddleware));

  await app.listen(3000);
}
bootstrap();
