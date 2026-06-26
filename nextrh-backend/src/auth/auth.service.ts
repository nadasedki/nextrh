import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { v4 as uuidv4 } from 'uuid'; 
import * as nodemailer from 'nodemailer';
//import { Resend } from 'resend';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
//private resend = new Resend(process.env.RESEND_API_KEY);
// // Store reset tokens in memory (for demo; production should use DB)
  //private passwordResetTokens: Record<string, number> = {}; // token -> user_id
  private readonly logger = new Logger(AuthService.name);
  private resetTokens = new Map<string, { userId: number; expires: number }>();

 
 async sendWelcomeEmail(email: string, password: string, name: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.verify();

      await transporter.sendMail({
        // LA LIGNE MAGIQUE : Nom d'affichage + ton email technique / from: `"NextStep HR Portal" <${process.env.EMAIL_FROM}>`, 
        from: `"NextStep HR Portal" <${process.env.EMAIL_FROM}>`, 
        to: email, 
        subject: 'Bienvenue dans l\'équipe - Vos accès',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #2563eb; text-align: center;">Bienvenue chez NextStep IT !</h2>
            <p>Bonjour <strong>${name}</strong>,</p>
            <p>Un compte collaborateur a été créé pour vous par votre Team Leader.</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Lien de connexion :</strong> <a href="http://localhost:8080/login">Portail RH</a></p>
              <p style="margin: 5px 0;"><strong>Identifiant :</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Mot de passe temporaire :</strong> <code>${password}</code></p>
            </div>
            <p style="font-size: 0.9em; color: #666;">Par mesure de sécurité, merci de modifier ce mot de passe lors de votre première connexion.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="text-align: center; font-size: 0.8em; color: #aaa;">Ceci est un message automatique du système RH NextStep.</p>
          </div>
        `,
      });

      this.logger.log(`✅ Email envoyé avec succès à ${email}`);
    } catch (error) {
      this.logger.error(`❌ Erreur d'envoi : ${error.message}`);
      if (error.message.includes('535')) {
       this.logger.error("Vérifiez que vous utilisez bien la clé de l'onglet SMTP et non l'onglet API !");
    }
    }
  }

  
  // Validate user credentials
  async validateUser(email: string, password: string, requestedRole: string): Promise<any> {
    const user = await this.usersService.findByEmail(email); // ensure roles are loaded
    if (!user) throw new UnauthorizedException('User with this email does not exist');

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) throw new UnauthorizedException('Password is incorrect');

    const hasRole = user.role?.role_name === requestedRole;
  if (!hasRole) throw new UnauthorizedException('Role not assigned to user');

    return user;
  }

  // Login
  async login(loginDto: { email: string; password: string; requestedRole: string }) {
    const { email, password, requestedRole } = loginDto;

    const user = await this.validateUser(email, password, requestedRole);

    const payload = { sub: user.user_id, email: user.email, role: requestedRole,full_name: user.full_name };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role:user.role,
        active: user.active,
      },
    };
  }

  // Register new user
  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password_hash, 10);
    return this.usersService.create({ ...dto, password_hash: hashedPassword });
  }


async forgotPassword(dto: ForgotPasswordDto) {
  const { email } = dto; // Extract email from DTO
  const user = await this.usersService.findByEmail(email);
  if (!user) throw new NotFoundException('User not found');

  const token = uuidv4();
  this.resetTokens.set(token, { userId: user.user_id, expires: Date.now() + 3600000 });

  // Use your Brevo transporter logic here
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER?.trim(),
      pass: process.env.SMTP_PASS?.trim(),
    },
  });

  const resetLink = `http://localhost:8080/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"NextStep Support" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `<p>Cliquez ici pour changer votre mot de passe : <a href="${resetLink}">${resetLink}</a></p>`,
  });

  return { message: 'Email de réinitialisation envoyé' };
}

async resetPassword(dto: ResetPasswordDto) {
  const { token, newPassword } = dto; // Extract from DTO
  const data = this.resetTokens.get(token);

  if (!data || data.expires < Date.now()) {
    throw new BadRequestException('Lien invalide ou expiré');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await this.usersService.updatePassword(data.userId, hashedPassword);

  this.resetTokens.delete(token);
  return { message: 'Mot de passe mis à jour avec succès' };
}}