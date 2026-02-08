import { AuthService } from './auth.service';
import { LoginDto, SignupDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(dto: SignupDto): Promise<{
        access_token: string;
    }>;
    register(dto: SignupDto): Promise<{
        access_token: string;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
    }>;
    debug(req: any): Promise<{
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
    getProfile(req: any): any;
    getAdmin(req: any): {
        message: string;
        user: any;
    };
    changePassword(req: any, dto: any): Promise<{
        message: string;
    }>;
}
