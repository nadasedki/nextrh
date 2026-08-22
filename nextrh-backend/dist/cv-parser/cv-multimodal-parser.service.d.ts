import { ILlmEngine } from '../llm/llm.interface';
export interface ParsedCvResponse {
    status: 'success';
    execution_metrics: {
        total_time_ms: number;
        heuristic_time_ms: number;
        llm_inference_ms: number;
        fallback_triggered: boolean;
        character_count: number;
        parser_mode: 'gemini_multimodal';
    };
    data: {
        profile: {
            name: string | null;
            profession: string | null;
            phone: string | null;
            fax: string | null;
            email: string | null;
            address: string | null;
            skills: string[];
        };
        experience: Array<{
            period: string | null;
            company: string;
            role: string;
            lowConfidence: boolean;
        }>;
        certifications: Array<{
            certName: string;
            provider: string;
            date: string | null;
            issue_date: string | null;
            expiry_date: null;
            lowConfidence: boolean;
        }>;
        education: Array<{
            year: string | null;
            institution: string;
            degree: string;
            lowConfidence: boolean;
        }>;
        projects: Array<{
            year: string | null;
            client: string;
            description: string;
            lowConfidence: boolean;
        }>;
    };
}
export declare class CvMultimodalParserService {
    private readonly llmEngine;
    private readonly logger;
    constructor(llmEngine: ILlmEngine);
    parseCvPdf(fileBuffer: Buffer): Promise<ParsedCvResponse>;
    private mapToResponse;
}
