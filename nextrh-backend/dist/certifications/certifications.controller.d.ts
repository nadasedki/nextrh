import { CertificationsService } from './certifications.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';
export declare class CertificationsController {
    private readonly service;
    constructor(service: CertificationsService);
    getMyCertifications(req: any): Promise<import("./entities/certification.entity").Certification[]>;
    create(req: any, dto: CreateCertificationDto): Promise<import("./entities/certification.entity").Certification>;
    update(id: number, req: any, dto: UpdateCertificationDto): Promise<import("./entities/certification.entity").Certification>;
    remove(id: number, req: any): Promise<import("./entities/certification.entity").Certification>;
    uploadCertificate(file: Express.Multer.File, req: any): Promise<{
        status: string;
        message: string;
        data?: undefined;
    } | {
        status: string;
        data: void;
        message: string;
    }>;
}
