export interface LlmOptions {
    model?: string;
    temperature?: number;
    numCtx?: number;
    numPredict?: number;
}
export interface LlmDocumentAttachment {
    type: 'document' | 'image';
    mediaType: string;
    data: string;
}
export interface ILlmEngine {
    generate(prompt: string, options?: LlmOptions): Promise<string>;
    generateStructured<T>(prompt: string, schema: object, options?: LlmOptions, attachment?: LlmDocumentAttachment): Promise<T>;
}
export declare const LLM_ENGINE = "LLM_ENGINE";
export declare const EMBEDDING_ENGINE = "EMBEDDING_ENGINE";
