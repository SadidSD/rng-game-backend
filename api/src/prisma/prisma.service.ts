import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    // Connect to the database on module initialization
    async onModuleInit() {
        try {
            await this.$connect();
        } catch (error) {
            console.error('Failed to connect to database:', error);
            throw error;
        }
    }
}
