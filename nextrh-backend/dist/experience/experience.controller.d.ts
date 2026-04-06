import { ExperienceService } from './experience.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
export declare class ExperienceController {
    private readonly experienceService;
    constructor(experienceService: ExperienceService);
    create(req: any, createExperienceDto: CreateExperienceDto): Promise<{
        id: number;
        company: string;
        role: string;
        description: string;
        startDate: Date;
        endDate: Date;
    }>;
    findMyExperiences(req: any): Promise<{
        id: number;
        company: string;
        role: string;
        description: string;
        startDate: Date;
        endDate: Date;
    }[]>;
}
