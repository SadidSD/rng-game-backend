import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Use custom logger
  const logger = app.get(LoggerService);
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  logger.info('Starting TCG Backend...');

  // 1. Global Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Enable CORS for Frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://rng-game-backend-production.up.railway.app',
      'https://rng-game-backend.vercel.app',
      'https://rng-gamez-shop.vercel.app',
      'http://localhost:3002',
      /https:\/\/.*\.onrender\.com/,
      /https:\/\/.*\.vercel\.app/
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, x-api-key',
  });

  // Set Global Prefix to /api (e.g. localhost:3001/api/products)
  app.setGlobalPrefix('api');

  // 2. Swagger Docs
  const config = new DocumentBuilder()
    .setTitle('TCG SaaS API')
    .setDescription('The multi-tenant TCG platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Add Health Check at Root (/) to satisfy Railway/LoadBalancers
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/', (req: any, res: any) => {
    res.send({ status: 'ok', message: 'TCG Backend is running (v1.3 - Production Ready)' });
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  const server = app.getHttpServer();
  const address = server.address();
  logger.info(`Application is running on: ${await app.getUrl()}`);
  logger.info(`Server bound to: ${JSON.stringify(address)}`);
}
bootstrap();
