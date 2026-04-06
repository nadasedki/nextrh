import { TrainingService } from '../training/training.service';
import { CreateTrainingDto } from './dto/create-training.dto';
export declare class TrainingController {
    private readonly trainingService;
    constructor(trainingService: TrainingService);
    createTraining(req: any, createDto: CreateTrainingDto): Promise<import("./entities/training.entity").Training>;
    findMine(req: any): Promise<import("./entities/training.entity").Training[]>;
}
