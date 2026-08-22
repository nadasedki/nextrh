import { ILlmEngine } from '../../llm/llm.interface';
export declare class LlmFallbackService {
    private readonly llmEngine;
    private readonly logger;
    private readonly llmModel;
    constructor(llmEngine: ILlmEngine);
    runFallback<T>(sectionKey: string, textBlock: string): Promise<T[] | null>;
}
