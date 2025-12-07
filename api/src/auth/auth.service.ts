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

        // Create Store
        const store = await this.prisma.store.create({
            data: {
                name: dto.storeName,
            },
        });

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Create Admin User
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                role: Role.ADMIN,
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
