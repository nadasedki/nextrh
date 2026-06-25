import { TrainingService } from '../training/training.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
export declare class TrainingController {
    private readonly trainingService;
    constructor(trainingService: TrainingService);
    createTraining(req: any, createDto: CreateTrainingDto): Promise<void>;
    findMine(req: any): Promise<import("./entities/training.entity").Training[]>;
    updateTraining(req: any, id: number, updateDto: UpdateTrainingDto): Promise<import("./entities/training.entity").Training>;
    deleteTraining(req: any, id: number): Promise<{
        message: string;
    }>;
}
