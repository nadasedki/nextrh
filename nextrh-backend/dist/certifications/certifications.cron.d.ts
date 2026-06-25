import { CertificationsService } from './services/certifications.service';
export declare class CertificationsCron {
    private readonly certificationsService;
    private readonly logger;
    constructor(certificationsService: CertificationsService);
    handleDailyCertificationEvaluation(): Promise<void>;
}
