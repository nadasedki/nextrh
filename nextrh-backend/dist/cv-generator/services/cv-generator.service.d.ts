import { Queue } from 'bullmq';
import { CvTemplateService } from './cv-template.service';
import { CvDataFormatterService } from './cv-data-formatter.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { ILlmEngine } from '../../llm/llm.interface';
import { FormattedCandidateData } from '../candidate-data.types';
import { ConfigService } from '@nestjs/config';
export declare class CvGeneratorService {
    private readonly templateService;
    private readonly dataFormatter;
    private readonly pdfGenerator;
    private readonly llmEngine;
    private readonly configService;
    private readonly cvGenerationQueue;
    private readonly logger;
    private readonly generatedOutputDir;
    constructor(templateService: CvTemplateService, dataFormatter: CvDataFormatterService, pdfGenerator: PdfGeneratorService, llmEngine: ILlmEngine, configService: ConfigService, cvGenerationQueue: Queue);
    enqueueCvGeneration(templateId: string, userId: number): Promise<{
        status: string;
        message: string;
        jobId: string;
    }>;
    getGenerationJobStatus(jobId: string): Promise<{
        jobId: string;
        state: string;
        status: string;
        progress: number;
        result?: undefined;
        failedReason?: undefined;
    } | {
        jobId: string;
        state: import("bullmq").JobState | "unknown";
        progress: import("bullmq").JobProgress;
        result: any;
        failedReason: string;
        status?: undefined;
    }>;
    compileSkeleton(skeleton: string, candidate: FormattedCandidateData): Promise<string>;
    getGeneratedFilePath(fileName: string): string;
    compileAndRenderPdf(templateId: string, userId: number): Promise<{
        downloadUrl: string;
        fileName: string;
    }>;
}
