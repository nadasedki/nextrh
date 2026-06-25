import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { Cv } from 'src/cvs/entities/cv.entity';
import { ScoringService } from 'src/scoring/scoring.service';
export declare class ProjectService {
    private projectRepository;
    private readonly scoringService;
    constructor(projectRepository: Repository<Project>, scoringService: ScoringService);
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
    update(id: number, userId: number, updateDto: any): Promise<any>;
    remove(id: number, userId: number): Promise<void>;
}
