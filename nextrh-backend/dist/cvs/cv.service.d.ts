import { DataSource, Repository } from 'typeorm';
import { Cv } from './entities/cv.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
export declare class CvService {
    private cvRepository;
    private dataSource;
    private readonly eventEmitter;
    private readonly configService;
    private readonly uploadDir;
    constructor(cvRepository: Repository<Cv>, dataSource: DataSource, eventEmitter: EventEmitter2, configService: ConfigService);
    saveIdentityCv(userId: number, filePath: string, cvJson: any): Promise<Cv>;
    getFullCvData(cvId: number): Promise<any>;
    remove(cvId: number, userId: number): Promise<void>;
    findByUserId(userId: number): Promise<Cv | null>;
}
