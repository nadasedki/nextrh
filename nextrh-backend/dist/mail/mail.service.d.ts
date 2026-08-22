import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private readonly configService;
    private readonly logger;
    private transporter;
    constructor(configService: ConfigService);
    sendWelcomeEmail(email: string, name: string, setupToken: string): Promise<void>;
    sendResetPasswordEmail(email: string, name: string, resetToken: string): Promise<void>;
    private sendMail;
}
