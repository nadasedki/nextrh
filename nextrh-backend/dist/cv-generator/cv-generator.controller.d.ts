import { CvGeneratorService } from './cv-generator.service';
import { Response } from 'express';
export declare class CvGeneratorController {
    private readonly generatorService;
    constructor(generatorService: CvGeneratorService);
    generate(cvId: string, file: Express.Multer.File, res: Response): Promise<void>;
}
