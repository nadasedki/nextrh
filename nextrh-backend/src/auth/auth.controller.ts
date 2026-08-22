import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler'; 
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEAM_LEADER')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Stricter Rate Limit: Allow only 5 login attempts every 60 seconds
   */
  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 2. Add Throttle limit
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Stricter Rate Limit: Allow only 3 forgot password requests every 60 seconds
   */
  @Post('forgot-password')
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3. Add Throttle limit
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}