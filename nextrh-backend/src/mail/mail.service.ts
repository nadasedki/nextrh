import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

// Inside src/mail/mail.service.ts

  constructor(private readonly configService: ConfigService) {
    // 1. Safely parse variables to prevent string-to-boolean evaluation bugs
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = Number(this.configService.get('SMTP_PORT') || 587);
    const smtpSecure = this.configService.get('SMTP_SECURE') === 'true'; // Evaluates "false" string to boolean false

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      // 2. Add TLS configuration to handle local proxy/firewall certificate restrictions
      tls: {
        rejectUnauthorized: false, // Prevents certificate handshake errors
      }
    });
  }

  /**
   * Sends a welcome email with a secure setup link instead of a raw plaintext password
   */
  async sendWelcomeEmail(email: string, name: string, setupToken: string): Promise<void> {
    const appBaseUrl = this.configService.get<string>('APP_BASE_URL');
    const setupLink = `${appBaseUrl}/setup-password?token=${setupToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">Bienvenue chez NextStep IT !</h2>
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Un compte collaborateur a été créé pour vous par votre Team Leader.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${setupLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Activer mon compte
          </a>
        </div>
        <p style="font-size: 0.9em; color: #666; text-align: center;">Ce lien d'activation expirera dans 24 heures pour des raisons de sécurité.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="text-align: center; font-size: 0.8em; color: #aaa;">Ceci est un message automatique du système RH NextStep.</p>
      </div>
    `;

    await this.sendMail(email, "Bienvenue dans l'équipe - Activez votre compte", htmlContent);
  }

  /**
   * Sends a password reset link
   */
  async sendResetPasswordEmail(email: string, name: string, resetToken: string): Promise<void> {
    const appBaseUrl = this.configService.get<string>('APP_BASE_URL');
    const resetLink = `${appBaseUrl}/reset-password?token=${resetToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">Réinitialisation de mot de passe</h2>
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="font-size: 0.9em; color: #666; text-align: center;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="text-align: center; font-size: 0.8em; color: #aaa;">Ceci est un message automatique de NextStep Support.</p>
      </div>
    `;

    await this.sendMail(email, 'Réinitialisation de votre mot de passe', htmlContent);
  }

  private async sendMail(to: string, subject: string, html: string): Promise<void> {
    const fromAddress = this.configService.get<string>('EMAIL_FROM');
    
    try {
      await this.transporter.sendMail({
        from: `"NextStep HR Portal" <${fromAddress}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`✅ Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${to}: ${error.message}`);
    }
  }
}