import { RagStructuredOutput } from '../types/rag-types';
import { ILlmEngine } from '../../llm/llm.interface';
export declare class LlmService {
    private readonly llmEngine;
    private readonly logger;
    constructor(llmEngine: ILlmEngine);
    generate(prompt: string, schema: object): Promise<RagStructuredOutput>;
}
