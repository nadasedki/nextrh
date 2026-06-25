import { CvService } from '../cvs/cv.service';
export declare class CvGenerateService {
    private readonly cvService;
    constructor(cvService: CvService);
    private setupHandlebars;
    processSmartPdf(cvId: number, file: Express.Multer.File): Promise<Buffer>;
    private askQwenToCreateTemplate;
    private renderFinalPdf;
    private convertPdfToDocx;
    private renderDocx;
}
