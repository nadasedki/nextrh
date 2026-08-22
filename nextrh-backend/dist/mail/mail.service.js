"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let MailService = MailService_1 = class MailService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(MailService_1.name);
        const smtpHost = this.configService.get('SMTP_HOST');
        const smtpPort = Number(this.configService.get('SMTP_PORT') || 587);
        const smtpSecure = this.configService.get('SMTP_SECURE') === 'true';
        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
            tls: {
                rejectUnauthorized: false,
            }
        });
    }
    async sendWelcomeEmail(email, name, setupToken) {
        const appBaseUrl = this.configService.get('APP_BASE_URL');
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
    async sendResetPasswordEmail(email, name, resetToken) {
        const appBaseUrl = this.configService.get('APP_BASE_URL');
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
    async sendMail(to, subject, html) {
        const fromAddress = this.configService.get('EMAIL_FROM');
        try {
            await this.transporter.sendMail({
                from: `"NextStep HR Portal" <${fromAddress}>`,
                to,
                subject,
                html,
            });
            this.logger.log(`✅ Email sent successfully to ${to}`);
        }
        catch (error) {
            this.logger.error(`❌ Failed to send email to ${to}: ${error.message}`);
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map