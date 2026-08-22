import { ConfigService } from '@nestjs/config';
import { ILlmEngine, LlmDocumentAttachment, LlmOptions } from '../llm.interface';
export declare class OllamaProvider implements ILlmEngine {
    private readonly configService;
    private readonly logger;
    private readonly model;
    constructor(configService: ConfigService);
    private getModelInstance;
    generate(prompt: string, options?: LlmOptions): Promise<string>;
    generateStructured<T>(prompt: string, schema: object, options?: LlmOptions, attachment?: LlmDocumentAttachment): Promise<T>;
}
