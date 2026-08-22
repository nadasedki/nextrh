import { TrainingService } from '../training/training.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
export declare class TrainingController {
    private readonly trainingService;
    constructor(trainingService: TrainingService);
    findMine(req: any): Promise<import("./entities/training.entity").Training[]>;
    findEmployeeTrainings(userId: number): Promise<import("./entities/training.entity").Training[]>;
    createTraining(userId: number, createDto: CreateTrainingDto): Promise<import("./entities/training.entity").Training>;
    updateTraining(id: number, userId: number, updateDto: UpdateTrainingDto): Promise<import("./entities/training.entity").Training>;
    deleteTraining(id: number, userId: number): Promise<{
        message: string;
    }>;
}
