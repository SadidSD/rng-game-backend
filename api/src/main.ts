import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter({
    querystringParser: str => ({ ...require('querystring').parse(str) }),
    bodyLimit: 2 * 1024 * 1024, // Reduced to 2MB to prevent resource exhaustion
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
    { rawBody: true }
  );
  // Use custom logger
  const logger = app.get(LoggerService);
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  logger.info('Starting TCG Backend with Fastify...');

  // Global security headers via Helmet
  await app.register(require('@fastify/helmet'), {
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // Fastify Multipart for file uploads
  await app.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB file limit
    },
  });

  // Fastify Static for serving uploaded files
  const path = require('path');
  await app.register(require('@fastify/static'), {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  });

  await app.register(require('@fastify/static'), {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/api/uploads/',
    decorateReply: false,
  });

  // 1. Global Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Enable CORS with production whitelist
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
      process.env.FRONTEND_URL,
      process.env.ADMIN_DASHBOARD_URL,
      'https://rng-gamez-shop.vercel.app',
      'https://rng-game-backend-six.vercel.app',
      'https://rng-gamez.com',
      'https://www.rng-gamez.com',
      'https://admin.rng-gamez.com',
    ].filter(Boolean)
    : [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3001',
    ];

  await app.register(require('@fastify/cors'), {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      // In development, allow all localhost origins (any port)
      if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'x-api-key'],
  });

  // Set Global Prefix to /api (e.g. localhost:3001/api/products)
  app.setGlobalPrefix('api');

  // 2. Swagger Docs at /docs (not /api to avoid route conflict)
  const config = new DocumentBuilder()
    .setTitle('TCG SaaS API')
    .setDescription('Multi-tenant TCG shop backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);


  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port, '0.0.0.0');
  logger.info(`Application is running on: http://127.0.0.1:${port}`);
  logger.info(`Server bound to: {\"address\":\"0.0.0.0\",\"family\":\"IPv4\",\"port\":${port}}`);
}

bootstrap();
