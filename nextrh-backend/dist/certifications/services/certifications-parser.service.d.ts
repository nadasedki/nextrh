import { AiService } from 'src/parser/ai.service';
import { CertificationsService } from './certifications.service';
export declare class CertificationsParserService {
    private readonly aiService;
    private readonly certsService;
    constructor(aiService: AiService, certsService: CertificationsService);
    extractAndPreviewCertificate(employeeId: number, file: Express.Multer.File, currentUserFullName: string): Promise<{
        certName: any;
        provider: any;
        issueDate: string;
        expiryDate: string;
        holderName: any;
        status: "active" | "expiring_soon" | "expired";
        filePath: string;
    }>;
    private calculateStatus;
    private formatDateToISO;
}
