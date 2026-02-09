import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
    private startTime: Date;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        this.startTime = new Date();
    }

    async checkHealth() {
        const checks = await Promise.allSettled([
            this.checkDatabase(),
            this.checkEnvironment(),
        ]);

        const dbCheck = checks[0];
        const envCheck = checks[1];

        const isHealthy = dbCheck.status === 'fulfilled' && envCheck.status === 'fulfilled';

        return {
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: this.getUptime(),
            version: '1.0.0',
            environment: this.configService.get('NODE_ENV') || 'development',
            checks: {
                database: dbCheck.status === 'fulfilled' ? dbCheck.value : { status: 'error', error: (dbCheck as any).reason?.message },
                environment: envCheck.status === 'fulfilled' ? envCheck.value : { status: 'error' },
            },
        };
    }

    private async checkDatabase() {
        try {
            // Simple query to verify DB connection
            await this.prisma.$queryRaw`SELECT 1`;
            return {
                status: 'ok',
                message: 'Database connection successful',
            };
        } catch (error) {
            throw new Error(`Database connection failed: ${error.message}`);
        }
    }

    private checkEnvironment() {
        const requiredVars = [
            'DATABASE_URL',
            'JWT_SECRET',
            'FRONTEND_API_KEY',
        ];

        const missing = requiredVars.filter(v => !this.configService.get(v));

        if (missing.length > 0) {
            return {
                status: 'warning',
                message: `Missing environment variables: ${missing.join(', ')}`,
            };
        }

        return {
            status: 'ok',
            message: 'All required environment variables present',
        };
    }

    private getUptime() {
        const uptimeMs = Date.now() - this.startTime.getTime();
        const uptimeSeconds = Math.floor(uptimeMs / 1000);
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;

        return `${hours}h ${minutes}m ${seconds}s`;
    }
}
