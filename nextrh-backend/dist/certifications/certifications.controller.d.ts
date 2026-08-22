import { CertificationsService } from './services/certifications.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';
import { CertificationsParserService } from './services/certifications-extraction.service';
export declare class CertificationsController {
    private readonly service;
    private readonly parserService;
    constructor(service: CertificationsService, parserService: CertificationsParserService);
    getMyCertifications(req: any): Promise<import("./entities/certification.entity").Certification[]>;
    create(req: any, dto: CreateCertificationDto): Promise<import("./entities/certification.entity").Certification>;
    update(id: number, req: any, dto: UpdateCertificationDto): Promise<import("./entities/certification.entity").Certification>;
    remove(id: number, req: any): Promise<void>;
    parseCertificatePreview(file: Express.Multer.File, req: any): Promise<{
        status: string;
        data: {
            certName: any;
            provider: any;
            issueDate: string;
            expiryDate: string;
            holderName: any;
            status: "active" | "expiring_soon" | "expired";
            filePath: string;
        };
    }>;
}
