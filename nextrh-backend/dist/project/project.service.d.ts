import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { Cv } from 'src/cvs/entities/cv.entity';
export declare class ProjectService {
    private projectRepository;
    constructor(projectRepository: Repository<Project>);
    create(userId: number, createDto: CreateProjectDto): Promise<any>;
    findByUser(userId: number): Promise<{
        id: number;
        name: string;
        client: string;
        role: string;
        description: string;
        startDate: Date;
        endDate: Date;
        technologies: string[];
    }[]>;
    createBulkFromParsedData(projectsData: any[], userId: number, cvEntity?: Cv): Promise<Project[]>;
    private mapYearToDates;
}
