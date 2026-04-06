import { Education } from './entities/education.entity';
import { Repository } from 'typeorm';
import { Cv } from 'src/cvs/entities/cv.entity';
export declare class EducationService {
    private readonly educationRepository;
    constructor(educationRepository: Repository<Education>);
    create(data: Partial<Education>): Promise<Education>;
    private extractYearsFromPeriod;
    createParsedEducation(educationData: any[], userId: number, cvEntity: Cv): Promise<Education[]>;
}
