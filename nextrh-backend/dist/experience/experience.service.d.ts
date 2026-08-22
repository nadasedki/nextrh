import { Repository } from 'typeorm';
import { Experience } from './entities/experience.entity';
import { Cv } from 'src/cvs/entities/cv.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class ExperienceService {
    private readonly experienceRepo;
    private readonly eventEmitter;
    constructor(experienceRepo: Repository<Experience>, eventEmitter: EventEmitter2);
    createBulkFromParsedData(expData: any[], userId: number, cvEntity?: Cv): Promise<Experience[]>;
    private parsePeriod;
    create(data: any): Promise<{
        id: number;
        company: string;
        role: string;
        description: string;
        startDate: Date;
        endDate: Date;
    }>;
    findByUser(userId: number): Promise<{
        id: number;
        company: string;
        role: string;
        description: string;
        startDate: Date;
        endDate: Date;
    }[]>;
    update(id: number, userId: number, data: any): Promise<{
        id: number;
        company: string;
        role: string;
        description: string;
        startDate: Date;
        endDate: Date;
    }>;
    remove(id: number, userId: number): Promise<Experience>;
    calculateTotalExperience(userId: number): Promise<number>;
}
