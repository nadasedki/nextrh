import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectService);
    createProject(req: any, createDto: CreateProjectDto): Promise<any>;
    findMine(req: any): Promise<{
        id: number;
        name: string;
        client: string;
        role: string;
        description: string;
        startDate: Date;
        endDate: Date;
        technologies: string[];
    }[]>;
    update(id: number, req: any, updateDto: any): Promise<any>;
    remove(id: number, req: any): Promise<void>;
}
