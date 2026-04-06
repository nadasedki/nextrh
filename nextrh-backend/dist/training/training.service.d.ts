import { Repository } from 'typeorm';
import { Training } from './entities/training.entity';
import { CreateTrainingDto } from './dto/create-training.dto';
import { User } from '../users/entities/user.entity';
export declare class TrainingService {
    private trainingRepository;
    private userRepository;
    constructor(trainingRepository: Repository<Training>, userRepository: Repository<User>);
    create(userId: number, createDto: CreateTrainingDto): Promise<Training>;
    findByUser(userId: number): Promise<Training[]>;
}
