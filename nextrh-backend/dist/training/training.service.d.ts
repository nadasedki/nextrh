import { Repository } from 'typeorm';
import { Training } from './entities/training.entity';
import { CreateTrainingDto } from './dto/create-training.dto';
import { User } from '../users/entities/user.entity';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { ScoringService } from 'src/scoring/scoring.service';
export declare class TrainingService {
    private trainingRepository;
    private userRepository;
    private readonly scoringService;
    constructor(trainingRepository: Repository<Training>, userRepository: Repository<User>, scoringService: ScoringService);
    create(userId: number, createDto: CreateTrainingDto): Promise<void>;
    findByUser(userId: number): Promise<Training[]>;
    update(userId: number, trainingId: number, updateDto: UpdateTrainingDto): Promise<Training>;
    remove(userId: number, trainingId: number): Promise<{
        message: string;
    }>;
}
