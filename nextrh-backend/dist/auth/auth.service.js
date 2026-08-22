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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const password_reset_token_entity_1 = require("./entities/password-reset-token.entity");
const mail_service_1 = require("../mail/mail.service");
const uuid_1 = require("uuid");
const crypto_1 = require("crypto");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = AuthService_1 = class AuthService {
    constructor(usersService, jwtService, mailService, tokenRepository) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.mailService = mailService;
        this.tokenRepository = tokenRepository;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async sendWelcomeEmail(email, name, setupToken) {
        await this.mailService.sendWelcomeEmail(email, name, setupToken);
    }
    async validateUser(email, password, requestedRole) {
        const user = await this.usersService.findByEmail(email);
        if (!user)
            throw new common_1.UnauthorizedException('This email does not exist.');
        if (user.active === false) {
            throw new common_1.UnauthorizedException('Your account has been deactivated. Please contact your system administrator.');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid)
            throw new common_1.UnauthorizedException('Incorrect password.');
        const hasRole = user.role?.role_name === requestedRole;
        if (!hasRole)
            throw new common_1.UnauthorizedException('The requested role is not assigned to you');
        return user;
    }
    async login(loginDto) {
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
    async register(dto) {
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            throw new common_1.ConflictException('This email address is already registered in the system.');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        return this.usersService.create({
            email: dto.email,
            full_name: dto.full_name,
            role_id: dto.role_id,
            password: hashedPassword,
        });
    }
    async forgotPassword(dto) {
        const { email } = dto;
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return { message: 'If an account exists with this email, a password reset link has been sent.' };
        }
        const token = (0, uuid_1.v4)();
        const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 3600000);
        await this.tokenRepository.save({
            token_hash: tokenHash,
            user_id: user.user_id,
            expires_at: expiresAt,
        });
        await this.mailService.sendResetPasswordEmail(user.email, user.full_name, token);
        return { message: 'If an account exists with this email, a password reset link has been sent.' };
    }
    async resetPassword(dto) {
        const { token, newPassword } = dto;
        const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        const tokenRecord = await this.tokenRepository.findOne({ where: { token_hash: tokenHash } });
        if (!tokenRecord || tokenRecord.used || tokenRecord.expires_at < new Date()) {
            throw new common_1.BadRequestException('Invalid or expired reset link.');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.updatePassword(tokenRecord.user_id, hashedPassword);
        tokenRecord.used = true;
        await this.tokenRepository.save(tokenRecord);
        return { message: 'Password updated successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, typeorm_1.InjectRepository)(password_reset_token_entity_1.PasswordResetToken)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        mail_service_1.MailService,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map