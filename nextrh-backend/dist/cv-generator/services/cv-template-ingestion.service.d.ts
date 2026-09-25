import { Repository } from 'typeorm';
import { CvTemplate } from '../entities/cv-template.entity';
import { ILlmEngine } from '../../llm/llm.interface';
export declare class CvTemplateIngestionService {
    private readonly templateRepo;
    private readonly llmEngine;
    private readonly logger;
    constructor(templateRepo: Repository<CvTemplate>, llmEngine: ILlmEngine);
    ingestTemplateFromDisk(fullDiskPath: string, relativePdfPath: string, name: string, userId: number): Promise<{
        templateId: string;
        skeleton: string;
    }>;
}
