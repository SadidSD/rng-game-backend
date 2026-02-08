import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, SignupDto } from './dto/auth.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    signup(dto: SignupDto): Promise<{
        access_token: string;
    }>;
    private createStoreUser;
    register(dto: SignupDto): Promise<{
        access_token: string;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
    }>;
    private signToken;
    changePassword(userId: string, dto: any): Promise<{
        message: string;
    }>;
    debugLogin(email: string, password?: string): Promise<{
        status: string;
        email: string;
        id?: undefined;
        role?: undefined;
        storeId?: undefined;
        passwordProvided?: undefined;
        passwordMatch?: undefined;
        storedHashPrefix?: undefined;
    } | {
        status: string;
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        storeId: string;
        passwordProvided: boolean;
        passwordMatch: boolean;
        storedHashPrefix: string;
    }>;
}
