import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<import("../users/entities/user.entity").User>;
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
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
