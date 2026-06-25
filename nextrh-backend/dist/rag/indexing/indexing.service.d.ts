import { CvService } from '../cv.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { VectorService } from '../vector/vector.service';
export declare class IndexingService {
    private readonly cvService;
    private readonly embeddingService;
    private readonly vectorService;
    private readonly logger;
    constructor(cvService: CvService, embeddingService: EmbeddingService, vectorService: VectorService);
    handleCertificationSaved(payload: any): Promise<void>;
    handleCertificationDeleted(payload: {
        certId: number;
    }): Promise<void>;
    indexAllCVs(): Promise<{
        totalCVs: number;
        totalPoints: number;
    }>;
    private createVectorPoint;
    private mapTypeToTable;
}
