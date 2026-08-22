import { ConfigService } from '@nestjs/config';
import { EmployeeProfileService } from 'src/Employee/employeeProfile.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { VectorService } from '../vector/vector.service';
import { ChunkingService } from '../chunking/chunking.service';
import { VectorMappingRepository } from './vector-mapping.repository';
export interface ReindexResult {
    points: number;
    status: 'success' | 'no_profile' | 'error';
    error?: string;
}
export interface IndexAllResult {
    totalUsers: number;
    totalPoints: number;
    failedUsers: number[];
}
export declare class IndexingService {
    private readonly configService;
    private readonly employeeProfileService;
    private readonly embeddingService;
    private readonly vectorService;
    private readonly chunkingService;
    private readonly mappingRepository;
    private readonly logger;
    constructor(configService: ConfigService, employeeProfileService: EmployeeProfileService, embeddingService: EmbeddingService, vectorService: VectorService, chunkingService: ChunkingService, mappingRepository: VectorMappingRepository);
    reindexUser(userId: number): Promise<ReindexResult>;
    indexAllCVs(): Promise<IndexAllResult>;
    private embedChunks;
    private insertWithRetry;
    private deleteWithRetry;
    private mapTypeToTable;
}
