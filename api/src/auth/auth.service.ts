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
        // ... (existing admin/staff signup logic)
        // Refactor: Rename existing signup to 'createStoreUser' internally if needed, 
        // but for now, I'll keep signup as the "Protected/Admin" creation and add 'register' as public.
        // Actually, the user asked for Public Signup.

        // Let's verify if 'signup' is used by Dashboard or CLI only.
        // It's used by CLI. 
        // I will Create a NEW method 'register' for customers.
        return this.createStoreUser(dto);
    }

    private async createStoreUser(dto: SignupDto) {
        // ... (Logic from Lines 14-51)
        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) throw new ConflictException('User already exists');

        const storeId = process.env.SINGLE_TENANT_STORE_ID || 'd02dbcba-81b5-4f9d-831c-54fe9a803081';
        let store = await this.prisma.store.findUnique({ where: { id: storeId } });
        let role: Role = Role.STAFF;

        if (!store) {
            console.log(`Creating Default Store: ${storeId}`);
            store = await this.prisma.store.create({
                data: {
                    id: storeId,
                    name: dto.storeName || 'TCG Store',
                    apiKey: require('crypto').randomBytes(32).toString('hex'),
                },
            });
            role = Role.ADMIN;
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

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

    async register(dto: SignupDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) throw new ConflictException('User already exists');

        const storeId = process.env.SINGLE_TENANT_STORE_ID || 'd02dbcba-81b5-4f9d-831c-54fe9a803081';

        // Ensure store exists (it should)
        const store = await this.prisma.store.findUnique({ where: { id: storeId } });
        if (!store) throw new ConflictException('Store not configured');

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Force Role = CUSTOMER
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                role: Role.CUSTOMER,
                storeId: store.id,
            },
        });

        // Also Create Customer Profile (if it doesn't exist)
        // This links the Auth User to the Customer Data
        await this.prisma.customer.upsert({
            where: { storeId_email: { storeId, email: dto.email } },
            update: {}, // Don't overwrite existing customer data
            create: {
                email: dto.email,
                storeId: storeId,
                firstName: dto.firstName || '',
                lastName: dto.lastName || '',
            }
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

    async changePassword(userId: string, dto: any) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('User not found');

        const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
        if (!isMatch) throw new UnauthorizedException('Invalid current password');

        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { message: 'Password updated successfully' };
    }
}
