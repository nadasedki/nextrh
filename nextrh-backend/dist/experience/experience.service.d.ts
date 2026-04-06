import { Repository } from 'typeorm';
import { Experience } from './entities/experience.entity';
import { Cv } from 'src/cvs/entities/cv.entity';
export declare class ExperienceService {
    private readonly experienceRepo;
    constructor(experienceRepo: Repository<Experience>);
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
}
