import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, SignupDto, Role } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { NotificationService } from '../notifications/notification.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private notificationService: NotificationService,
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

        const storeId = process.env.SINGLE_TENANT_STORE_ID;
        if (!storeId) throw new Error('SINGLE_TENANT_STORE_ID environment variable is required');
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

        const storeId = process.env.SINGLE_TENANT_STORE_ID;
        if (!storeId) throw new Error('SINGLE_TENANT_STORE_ID environment variable is required');

        // Ensure store exists (it should)
        const store = await this.prisma.store.findUnique({ where: { id: storeId } });
        if (!store) throw new ConflictException('Store not configured');

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Force Role = CUSTOMER
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                role: Role.CUSTOMER,
                storeId: store.id,
                isVerified: false,
                verificationToken: verificationToken,
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

        // Send verification email
        await this.notificationService.sendVerificationEmail(user.email, verificationToken);

        return { message: 'Registration successful. Please check your email to verify your account.' };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        if (!user.isVerified) {
            throw new UnauthorizedException('Please verify your email address before logging in.');
        }

        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');

        return this.signToken(user.id, user.email, user.role as Role, user.storeId);
    }

    private async signToken(userId: string, email: string, role: Role, storeId: string) {
        const payload = { sub: userId, email, role, storeId };
        const token = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '1d',
        });

        return {
            access_token: token,
        };
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                storeId: true,
            }
        });
        if (!user) throw new UnauthorizedException('User not found');

        // Fetch associated customer record to get creditBalance, etc.
        const customer = await this.prisma.customer.findUnique({
            where: { storeId_email: { storeId: user.storeId, email: user.email } },
            select: {
                firstName: true,
                lastName: true,
                creditBalance: true
            }
        });

        return {
            ...user,
            ...customer,
            // ensure creditBalance is a number, not Decimal object for frontend
            creditBalance: customer?.creditBalance ? Number(customer.creditBalance) : 0
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

    async verifyEmail(token: string) {
        const user = await this.prisma.user.findUnique({
            where: { verificationToken: token },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid or expired verification token');
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null,
            },
        });

        // Fetch customer profile to get the user's name for greeting
        const customer = await this.prisma.customer.findFirst({
            where: { email: user.email, storeId: user.storeId }
        });
        
        await this.notificationService.sendWelcomeEmail(user.email, customer?.firstName || '');

        return { message: 'Email verified successfully' };
    }
}
