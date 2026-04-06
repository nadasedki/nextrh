import { CvService } from './cv.service';
export declare class CvController {
    private readonly cvService;
    constructor(cvService: CvService);
    uploadCv(req: any, file: Express.Multer.File, body: any): Promise<{
        status: string;
        data: import("./entities/cv.entity").Cv;
    }>;
}
