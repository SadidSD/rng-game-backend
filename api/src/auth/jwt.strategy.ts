import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private prisma: PrismaService) {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) throw new Error('JWT_SECRET environment variable is required');
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtSecret,
        });
    }

    async validate(payload: any) {
        // payload = { sub: userId, email, role, storeId }

        // Check if user still exists (optional, improves security vs performance)
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub }
        });

        if (!user) {
            throw new UnauthorizedException();
        }

        // Attach to request.user
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            storeId: payload.storeId
        };
    }
}
