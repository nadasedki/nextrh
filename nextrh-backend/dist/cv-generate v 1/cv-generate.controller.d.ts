import { CvGenerateService } from './cv-generate.service';
import { Response } from 'express';
export declare class CvGenerateController {
    private readonly cvService;
    constructor(cvService: CvGenerateService);
    smartGenerate(cvId: string, file: Express.Multer.File, res: Response): Promise<Response<any, Record<string, any>>>;
}
