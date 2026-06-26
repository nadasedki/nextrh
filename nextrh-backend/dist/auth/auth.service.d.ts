import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    private readonly logger;
    private resetTokens;
    sendWelcomeEmail(email: string, password: string, name: string): Promise<void>;
    validateUser(email: string, password: string, requestedRole: string): Promise<any>;
    login(loginDto: {
        email: string;
        password: string;
        requestedRole: string;
    }): Promise<{
        access_token: string;
        user: {
            user_id: any;
            email: any;
            full_name: any;
            role: any;
            active: any;
        };
    }>;
    register(dto: RegisterDto): Promise<import("../users/entities/user.entity").User>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
