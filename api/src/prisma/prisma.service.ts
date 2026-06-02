import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Ensure DATABASE_URL always uses pgBouncer transaction pooler (port 6543).
// Render dashboard may set port 5432 (session mode) which exhausts the 15-connection
// pool limit during zero-downtime rolling deployments.
function getPoolerUrl(url: string | undefined): string | undefined {
    if (!url) return url;
    // Replace session-mode port 5432 with pgBouncer transaction pooler port 6543
    let fixed = url.replace(/:5432\//, ':6543/');
    // Ensure pgbouncer=true is in the query string
    if (!fixed.includes('pgbouncer=true')) {
        fixed += (fixed.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }
    // Cap the connection limit to 3 to stay within Supabase's 15-slot limit
    // even when both old and new containers run simultaneously during deploys
    if (!fixed.includes('connection_limit=')) {
        fixed += '&connection_limit=3';
    } else {
        // Overwrite whatever connection_limit was set to ensure it is safe
        fixed = fixed.replace(/connection_limit=\d+/, 'connection_limit=3');
    }
    return fixed;
}

@Injectable()
export class PrismaService extends PrismaClient {
    constructor() {
        super({
            datasources: {
                db: {
                    url: getPoolerUrl(process.env.DATABASE_URL),
                },
            },
        });
        // Do NOT call $connect() here — Prisma connects lazily on first query.
        // Eagerly connecting on module init fails during Render zero-downtime
        // rolling deploys because the old container still holds session connections.
    }
}
