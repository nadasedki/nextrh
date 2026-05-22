import { Response } from 'express';
import { CvGenerateService } from './cv-generate.service';
export declare class CvGenerateController {
    private readonly generateService;
    constructor(generateService: CvGenerateService);
    generatePdf(cvId: string, file: Express.Multer.File, res: Response): Promise<void>;
}
