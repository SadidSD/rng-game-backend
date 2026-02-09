import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
}

@Injectable()
export class LoggerService implements NestLoggerService {
    private context?: string;

    setContext(context: string) {
        this.context = context;
    }

    log(message: string, context?: string) {
        this.info(message, context);
    }

    info(message: string, context?: string) {
        const ctx = context || this.context;
        console.log(`[INFO] ${ctx ? `[${ctx}] ` : ''}${message}`);
    }

    debug(message: string, context?: string) {
        const ctx = context || this.context;
        console.debug(`[DEBUG] ${ctx ? `[${ctx}] ` : ''}${message}`);
    }

    warn(message: string, context?: string) {
        const ctx = context || this.context;
        console.warn(`[WARN] ${ctx ? `[${ctx}] ` : ''}${message}`);
        Sentry.captureMessage(message, 'warning');
    }

    error(message: string, trace?: string, context?: string) {
        const ctx = context || this.context;
        console.error(`[ERROR] ${ctx ? `[${ctx}] ` : ''}${message}`);
        if (trace) {
            console.error(trace);
        }

        // Send to Sentry
        if (trace) {
            Sentry.captureException(new Error(message));
        } else {
            Sentry.captureMessage(message, 'error');
        }
    }

    verbose(message: string, context?: string) {
        const ctx = context || this.context;
        console.log(`[VERBOSE] ${ctx ? `[${ctx}] ` : ''}${message}`);
    }
}
