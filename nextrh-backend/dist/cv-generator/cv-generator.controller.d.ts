import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { CvTemplateService } from './cv-template.service';
import { CvDataFormatterService } from './cv-data-formatter.service';
import { PdfGeneratorService } from './pdf-generator.service';
export declare class CvGeneratorController {
    private readonly templateService;
    private readonly dataFormatter;
    private readonly pdfGenerator;
    private readonly logger;
    constructor(templateService: CvTemplateService, dataFormatter: CvDataFormatterService, pdfGenerator: PdfGeneratorService);
    uploadTemplate(file: Express.Multer.File, name: string, userIdStr: string): Promise<{
        message: string;
        templateId: number;
    }>;
    generateCv(templateIdStr: string, userIdStr: string, res: Response): Promise<Response<any, Record<string, any>>>;
    getTemplates(): Promise<any[]>;
    testCandidateData(userIdStr: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: import("./candidate-data.types").FormattedCandidateData;
    }>;
}
