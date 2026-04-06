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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const bcrypt = __importStar(require("bcrypt"));
const jwt_1 = require("@nestjs/jwt");
const uuid_1 = require("uuid");
const nodemailer = __importStar(require("nodemailer"));
let AuthService = AuthService_1 = class AuthService {
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(AuthService_1.name);
        this.resetTokens = new Map();
    }
    async sendWelcomeEmail(email, password, name) {
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
                from: `"NextStep HR Portal" <${process.env.EMAIL_FROM}>`,
                to: email,
                subject: 'Bienvenue dans l\'équipe - Vos accès',
                html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #2563eb; text-align: center;">Bienvenue chez NextStep IT !</h2>
            <p>Bonjour <strong>${name}</strong>,</p>
            <p>Un compte collaborateur a été créé pour vous par votre Team Leader.</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Lien de connexion :</strong> <a href="http://localhost:5173/login">Portail RH</a></p>
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
        }
        catch (error) {
            this.logger.error(`❌ Erreur d'envoi : ${error.message}`);
            if (error.message.includes('535')) {
                this.logger.error("Vérifiez que vous utilisez bien la clé de l'onglet SMTP et non l'onglet API !");
            }
        }
    }
    async validateUser(email, password, requestedRole) {
        const user = await this.usersService.findByEmail(email);
        if (!user)
            throw new common_1.UnauthorizedException('User with this email does not exist');
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid)
            throw new common_1.UnauthorizedException('Password is incorrect');
        const hasRole = user.roles.some((role) => role.role_name === requestedRole);
        if (!hasRole)
            throw new common_1.UnauthorizedException('Role not assigned to user');
        return user;
    }
    async login(loginDto) {
        const { email, password, requestedRole } = loginDto;
        const user = await this.validateUser(email, password, requestedRole);
        const payload = { sub: user.user_id, email: user.email, role: requestedRole };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                user_id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                roles: user.roles.map((r) => r.role_name),
                active: user.active,
            },
        };
    }
    async register(dto) {
        const hashedPassword = await bcrypt.hash(dto.password_hash, 10);
        return this.usersService.create({ ...dto, password_hash: hashedPassword });
    }
    async forgotPassword(dto) {
        const { email } = dto;
        const user = await this.usersService.findByEmail(email);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const token = (0, uuid_1.v4)();
        this.resetTokens.set(token, { userId: user.user_id, expires: Date.now() + 3600000 });
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
    async resetPassword(dto) {
        const { token, newPassword } = dto;
        const data = this.resetTokens.get(token);
        if (!data || data.expires < Date.now()) {
            throw new common_1.BadRequestException('Lien invalide ou expiré');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.updatePassword(data.userId, hashedPassword);
        this.resetTokens.delete(token);
        return { message: 'Mot de passe mis à jour avec succès' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map