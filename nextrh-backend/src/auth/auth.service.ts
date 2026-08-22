// src/auth/auth.service.ts
import { 
  BadRequestException, 
  ConflictException, 
  Injectable, 
  Logger, 
  NotFoundException, 
  UnauthorizedException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { MailService } from '../mail/mail.service';
import { v4 as uuidv4 } from 'uuid'; 
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService, // Injected the clean MailService
    
    @InjectRepository(PasswordResetToken)
    private readonly tokenRepository: Repository<PasswordResetToken>, // Injected database repository
  ) {}

  /**
   * Helper wrapper to send welcome/setup emails (for Team Leaders/Admins creating accounts)
   */
  async sendWelcomeEmail(email: string, name: string, setupToken: string) {
    await this.mailService.sendWelcomeEmail(email, name, setupToken);
  }

  /**
   * Validate user credentials during login
   */
  async validateUser(email: string, password: string, requestedRole: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('This email does not exist.');
    if (user.active === false) {
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact your system administrator.'
      );
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) throw new UnauthorizedException('Incorrect password.');

    const hasRole = user.role?.role_name === requestedRole;
    if (!hasRole) throw new UnauthorizedException('The requested role is not assigned to you');

    return user;
  }

  /**
   * Handle user login
   */
  async login(loginDto: LoginDto) {
    const { email, password, requestedRole } = loginDto;
    const user = await this.validateUser(email, password, requestedRole);

    const payload = { 
      sub: user.user_id, 
      email: user.email, 
      role: requestedRole,
      full_name: user.full_name 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        active: user.active,
      },
    };
  }

/**
   * Register a new user (Only accessible to Admins / Team Leaders)
   */
  async register(dto: RegisterDto) {
    // 2. Pre-emptively check if the email is already taken
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('This email address is already registered in the system.');
    }

    // 3. If email is unique, safely hash and create the account
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    return this.usersService.create({ 
      email: dto.email,
      full_name: dto.full_name,
      role_id: dto.role_id,
      password: hashedPassword, 
    });
  }

  /**
   * Trigger a secure password reset email
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto;
    const user = await this.usersService.findByEmail(email);
    
    // Security Best Practice: Never tell the client if the email exists to prevent enumeration attacks.
    if (!user) {
      return { message: 'If an account exists with this email, a password reset link has been sent.' };
    }

    const token = uuidv4();
    const tokenHash = createHash('sha256').update(token).digest('hex'); // Hash the token securely
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiration duration

    // Save token hash to database
    await this.tokenRepository.save({
      token_hash: tokenHash,
      user_id: user.user_id,
      expires_at: expiresAt,
    });

    // Send the email with the raw (unhashed) token link
    await this.mailService.sendResetPasswordEmail(user.email, user.full_name, token);

    return { message: 'If an account exists with this email, a password reset link has been sent.' };
  }

  /**
   * Reset user password using token stored in DB
   */
  async resetPassword(dto: ResetPasswordDto) {
    const { token, newPassword } = dto;
    
    // Compute the hash of the received token to match it against database record
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const tokenRecord = await this.tokenRepository.findOne({ where: { token_hash: tokenHash } });

    if (!tokenRecord || tokenRecord.used || tokenRecord.expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired reset link.');
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(tokenRecord.user_id, hashedPassword);

    // Mark token as used to prevent replay attacks
    tokenRecord.used = true;
    await this.tokenRepository.save(tokenRecord);

    return { message: 'Password updated successfully' };
  }
}