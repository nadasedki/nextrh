import { ConfigService } from '@nestjs/config';
import { ILlmEngine } from './llm.interface';
export declare function createLlmEngine(configService: ConfigService): ILlmEngine;
export declare function createEmbeddingEngine(configService: ConfigService): any;
