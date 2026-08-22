import { ILlmEngine } from '../llm/llm.interface';
export interface ExtractedCertificate {
    certificate_name?: string;
    provider?: string;
    date_of_obtention?: string | null;
    date_of_expiration?: string | null;
    error?: string;
}
export declare class LlmService {
    private readonly llmEngine;
    private readonly logger;
    constructor(llmEngine: ILlmEngine);
    extractCertificate(fullText: string): Promise<ExtractedCertificate>;
}
