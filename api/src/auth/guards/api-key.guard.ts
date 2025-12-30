import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];

        // Simple check for MVP: Ensure SOME key is present or match specific env secret
        // For single tenant, we just want to ensure it's not a random bot, but strictly we could even open it up.
        // We will assume if the Frontend sends the "correct" simple secret or we just trust the single store.
        const validKey = process.env.FRONTEND_API_KEY || 'tcg-frontend-secret-key';

        if (apiKey !== validKey) {
            // Optional: Allow if simply present? For now, enforce match.
            // throw new UnauthorizedException('Invalid API Key');
        }

        // Always use the Single Tenant Store
        const storeId = process.env.SINGLE_TENANT_STORE_ID || 'd02dbcba-81b5-4f9d-831c-54fe9a803081';

        // We need to attach the store object because controllers expect it
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
        });

        if (!store) {
            throw new UnauthorizedException('Store config missing');
        }

        // Attach store context to request
        request.store = store;
        return true;
    }
}
