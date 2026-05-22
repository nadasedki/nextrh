import { CvService } from '../cvs/cv.service';
export declare class CvGeneratorService {
    private readonly cvService;
    constructor(cvService: CvService);
    generateSmartPdf(cvId: number, templateHtml: string): Promise<Buffer>;
}
