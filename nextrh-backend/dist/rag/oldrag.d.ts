import { OnModuleInit } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { VectorService } from './vector.service';
import { CvService } from './cv.service';
export declare class RagService implements OnModuleInit {
    private cvService;
    private embeddingService;
    private vectorService;
    constructor(cvService: CvService, embeddingService: EmbeddingService, vectorService: VectorService);
    onModuleInit(): Promise<void>;
    ensureCollectionExists(): Promise<void>;
    indexAllCVs(): Promise<number>;
    ask(question: string): Promise<string>;
}
