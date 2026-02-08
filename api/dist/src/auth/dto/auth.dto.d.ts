import { Role } from '@prisma/client';
export { Role };
export declare class SignupDto {
    storeName: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
