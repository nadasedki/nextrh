import { Repository } from 'typeorm';
import { Certification } from '../entities/certification.entity';
import { CreateCertificationDto } from '../dto/create-certification.dto';
import { UpdateCertificationDto } from '../dto/update-certification.dto';
import { AiService } from 'src/parser/ai.service';
import { Cv } from 'src/cvs/entities/cv.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
export declare class CertificationsService {
    private readonly certificationRepo;
    private readonly aiService;
    private readonly configService;
    private eventEmitter;
    private readonly certUploadDir;
    constructor(certificationRepo: Repository<Certification>, aiService: AiService, configService: ConfigService, eventEmitter: EventEmitter2);
    saveCertFileToDisk(fileBuffer: Buffer, employeeId: number, originalName: string): Promise<string>;
    findMyCertifications(employeeId: number): Promise<Certification[]>;
    create(employeeId: number, dto: CreateCertificationDto, fileBuffer?: Buffer, originalName?: string): Promise<Certification>;
    update(id: number, employeeId: number, dto: UpdateCertificationDto): Promise<Certification>;
    remove(id: number, employeeId: number): Promise<void>;
    createBulkFromParsedData(certsData: any[], userId: number, filePath?: string, cvEntity?: Cv): Promise<Certification[]>;
    private calculateStatus;
    evaluateAllCertificationsStatus(): Promise<{
        updatedCount: number;
    }>;
}
