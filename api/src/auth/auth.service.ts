import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, SignupDto, Role } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async signup(dto: SignupDto) {
        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) throw new ConflictException('User already exists');

        const storeId = process.env.SINGLE_TENANT_STORE_ID || 'd02dbcba-81b5-4f9d-831c-54fe9a803081';
        let store = await this.prisma.store.findUnique({ where: { id: storeId } });
        let role: Role = Role.STAFF; // Default role

        // If Store doesn't exist, Create it and make this user Admin
        if (!store) {
            console.log(`Creating Default Store: ${storeId}`);
            store = await this.prisma.store.create({
                data: {
                    id: storeId,
                    name: dto.storeName || 'TCG Store', // Fallback name
                    apiKey: require('crypto').randomBytes(32).toString('hex'),
                },
            });
            role = Role.ADMIN;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Create User linked to Single Tenant Store
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                role: role,
                storeId: store.id,
            },
        });

        return this.signToken(user.id, user.email, user.role, user.storeId);
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');

        return this.signToken(user.id, user.email, user.role as Role, user.storeId);
    }

    private async signToken(userId: string, email: string, role: Role, storeId: string) {
        const payload = { sub: userId, email, role, storeId };
        const token = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_SECRET || 'super-secret',
            expiresIn: '1d',
        });

        return {
            access_token: token,
        };
    }
}
