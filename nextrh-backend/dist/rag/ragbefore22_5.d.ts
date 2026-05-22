import { OnModuleInit } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { VectorService } from './vector.service';
import { CvService } from './cv.service';
import { EvaluationService } from '../modules/evaluation/evaluation.service';
export declare class RagService implements OnModuleInit {
    private cvService;
    private embeddingService;
    private vectorService;
    private evaluationService;
    constructor(cvService: CvService, embeddingService: EmbeddingService, vectorService: VectorService, evaluationService: EvaluationService);
    onModuleInit(): Promise<void>;
    ensureCollectionExists(): Promise<void>;
    indexAllCVs(): Promise<number>;
    ask(question: string): Promise<string>;
}
