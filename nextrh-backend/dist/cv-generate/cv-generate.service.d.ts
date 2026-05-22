import { CvService } from '../cvs/cv.service';
export declare class CvGenerateService {
    private readonly cvService;
    constructor(cvService: CvService);
    processSmartPdf(cvId: number, file: Express.Multer.File): Promise<Buffer>;
    private getMappingFromAI;
    private renderPdf;
}
