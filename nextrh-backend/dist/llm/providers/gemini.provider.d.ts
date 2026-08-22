import { ConfigService } from '@nestjs/config';
import { ILlmEngine, LlmDocumentAttachment, LlmOptions } from '../llm.interface';
export declare class GeminiProvider implements ILlmEngine {
    private readonly logger;
    private readonly model;
    constructor(configService: ConfigService);
    generate(prompt: string): Promise<string>;
    generateStructured<T>(prompt: string, schema: object, options?: LlmOptions, attachment?: LlmDocumentAttachment): Promise<T>;
}
