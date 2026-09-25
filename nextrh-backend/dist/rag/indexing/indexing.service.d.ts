import { ConfigService } from '@nestjs/config';
import { EmployeeProfileService } from 'src/Employee/employeeProfile.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { VectorService } from '../vector/vector.service';
import { ChunkingService } from '../chunking/chunking.service';
import { VectorMappingRepository } from './vector-mapping.repository';
import { Queue } from 'bullmq';
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
    private readonly vectorQueue;
    private readonly logger;
    constructor(configService: ConfigService, employeeProfileService: EmployeeProfileService, embeddingService: EmbeddingService, vectorService: VectorService, chunkingService: ChunkingService, mappingRepository: VectorMappingRepository, vectorQueue: Queue);
    enqueueUserIndexing(userId: number): Promise<{
        status: string;
        jobId: string;
    }>;
    enqueueBulkReindexing(): Promise<{
        status: string;
        jobId: string;
    }>;
    enqueueUserDeletion(userId: number): Promise<void>;
    reindexUser(userId: number): Promise<ReindexResult>;
    deleteUserVectors(userId: number): Promise<void>;
    indexAllCVs(): Promise<IndexAllResult>;
    private embedChunks;
    private mapTypeToTable;
}
