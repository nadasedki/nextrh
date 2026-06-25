import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Project } from 'src/project/entities/project.entity';
import { Training } from 'src/training/entities/training.entity';
import { Certification } from 'src/certifications/entities/certification.entity';
export declare class ScoringService {
    private readonly userRepository;
    private readonly projectRepository;
    private readonly trainingRepository;
    private readonly certificationRepository;
    constructor(userRepository: Repository<User>, projectRepository: Repository<Project>, trainingRepository: Repository<Training>, certificationRepository: Repository<Certification>);
    calculateAndSaveScore(userId: number): Promise<number>;
    getUserScore(userId: number): Promise<number>;
    getLeaderboard(): Promise<User[]>;
}
