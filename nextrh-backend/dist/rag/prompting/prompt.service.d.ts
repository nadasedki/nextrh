import { OnModuleInit } from '@nestjs/common';
import { RankedResult } from '../types/rag-types';
export declare class PromptService implements OnModuleInit {
    private readonly logger;
    private promptTemplate;
    private readonly PROMPT_PATH;
    readonly OUTPUT_SCHEMA: {
        type: string;
        properties: {
            reasoning: {
                type: string;
                description: string;
            };
            answer: {
                type: string;
                description: string;
            };
            explanation: {
                type: string;
                description: string;
            };
            confidence: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            sources: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
        };
        required: string[];
    };
    onModuleInit(): void;
    build(question: string, chunks: RankedResult[]): string;
}
