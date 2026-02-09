import { Module } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

// Initialize Sentry
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0, // 100% in dev, reduce to 0.1 in prod
    });
}

@Module({})
export class SentryModule { }
