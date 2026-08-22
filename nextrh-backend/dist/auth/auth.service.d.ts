import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { MailService } from '../mail/mail.service';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly mailService;
    private readonly tokenRepository;
    private readonly logger;
    constructor(usersService: UsersService, jwtService: JwtService, mailService: MailService, tokenRepository: Repository<PasswordResetToken>);
    sendWelcomeEmail(email: string, name: string, setupToken: string): Promise<void>;
    validateUser(email: string, password: string, requestedRole: string): Promise<any>;
    login(loginDto: LoginDto): Promise<{
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
