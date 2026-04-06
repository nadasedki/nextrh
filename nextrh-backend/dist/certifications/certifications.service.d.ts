import { Repository } from 'typeorm';
import { Certification } from './entities/certification.entity';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';
import { AiService } from 'src/parser/ai.service';
import { Cv } from 'src/cvs/entities/cv.entity';
export declare class CertificationsService {
    private readonly certificationRepo;
    private readonly aiService;
    constructor(certificationRepo: Repository<Certification>, aiService: AiService);
    findMyCertifications(employeeId: number): Promise<Certification[]>;
    create(employeeId: number, dto: CreateCertificationDto): Promise<Certification>;
    update(id: number, employeeId: number, dto: UpdateCertificationDto): Promise<Certification>;
    remove(id: number, employeeId: number): Promise<Certification>;
    extractAndSaveCertificate(employeeId: number, file: Express.Multer.File): Promise<Certification>;
    private mapAiToEntity;
    private calculateStatus;
    createBulkFromParsedData(certsData: any[], userId: number, filePath?: string, cvEntity?: Cv): Promise<Certification[]>;
    private parseFrenchDate;
    private inferProvider;
}
