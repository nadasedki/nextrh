import { DataSource } from 'typeorm';
import { ILlmEngine } from '../llm/llm.interface';
import { FormattedCandidateData } from './candidate-data.types';
export declare class CvTemplateService {
    private readonly llmEngine;
    private readonly dataSource;
    private readonly logger;
    constructor(llmEngine: ILlmEngine, dataSource: DataSource);
    extractSkeleton(fileBuffer: Buffer, name: string, userId: number): Promise<{
        templateId: number;
        skeleton: string;
    }>;
    getSkeleton(templateId: string): Promise<string>;
    compileSkeleton(skeleton: string, candidate: FormattedCandidateData): Promise<string>;
    findAll(): Promise<any[]>;
}
