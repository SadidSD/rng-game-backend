import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. Global Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Enable CORS for Frontend
  app.enableCors({
    origin: '*', // Allow all origins (Vercel, Localhost, etc.)
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
    res.send({ status: 'ok', message: 'TCG Backend is running' });
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  const server = app.getHttpServer();
  const address = server.address();
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Server bound to:`, address);
}
bootstrap();
