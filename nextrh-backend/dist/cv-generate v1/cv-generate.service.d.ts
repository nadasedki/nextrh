import { CvService } from '../cvs/cv.service';
export declare class CvGenerateService {
    private readonly cvService;
    constructor(cvService: CvService);
    processSmartTemplate(cvId: number, file: Express.Multer.File): Promise<Buffer>;
    private getSmartMappingFromOllama;
    private convertPdfToDocx;
    private injectDataWithPython;
}
