import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; 
import { EmployeeProfileService } from 'src/Employee/employeeProfile.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { VectorService, VectorPoint } from '../vector/vector.service';
import { ChunkingService, CandidateProfile, TextChunk } from '../chunking/chunking.service';
import { VectorMappingRepository } from './vector-mapping.repository';
import { InjectQueue } from '@nestjs/bullmq';
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

const CHUNK_TYPES = ['profile', 'projects', 'credentials'] as const;

@Injectable()
export class IndexingService {
  private readonly logger = new Logger(IndexingService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly employeeProfileService: EmployeeProfileService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorService: VectorService,
    private readonly chunkingService: ChunkingService,
    private readonly mappingRepository: VectorMappingRepository,
    @InjectQueue('vector-indexing') private readonly vectorQueue: Queue, // 👈 BullMQ Queue
  ) {}

  // =========================================================================
  // 1. BULLMQ QUEUE PRODUCER METHODS
  // =========================================================================
  
  /**
   * Pushes a single user indexing task into the BullMQ background queue
   */
  async enqueueUserIndexing(userId: number) {
    const job = await this.vectorQueue.add(
      'index-user',
      { userId },
      {
        jobId: `vector-user-${userId}`, // Deduplicates simultaneous requests for same user
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600, count: 500 },
        removeOnFail: { age: 86400 },
      },
    );
    this.logger.log(`User #${userId} queued for vector indexing [Job #${job.id}]`);
    return { status: 'queued', jobId: job.id };
  }

  /**
   * Pushes full database re-indexing task into the queue
   */
  async enqueueBulkReindexing() {
    const job = await this.vectorQueue.add(
      'reindex-all',
      {},
      {
        attempts: 1,
        removeOnComplete: { age: 86400 },
      },
    );
    return { status: 'queued', jobId: job.id };
  }

  /**
   * Pushes vector deletion task when a user or CV is deleted
   */
  async enqueueUserDeletion(userId: number) {
    await this.vectorQueue.add(
      'delete-user-vectors',
      { userId },
      {
        attempts: 2,
        removeOnComplete: true,
      },
    );
  }

  // =========================================================================
  // 2. CORE DOMAIN LOGIC: 3-VECTOR DOUBLE-BUFFERING GENERATION SWAP
  // =========================================================================
  
  /**
   * Re-indexes a single user with zero downtime using the Generation Swap (Gen 1 vs Gen 2)
   */
  async reindexUser(userId: number): Promise<ReindexResult> {
    if (!userId) {
      this.logger.error('reindexUser called with no userId');
      return { points: 0, status: 'error', error: 'missing userId' };
    }

    try {
      // 1. Fetch data from PostgreSQL
      const [cv, experiences, educations, projects, certifications, trainings] = await Promise.all([
        this.employeeProfileService.getCVByUserId(userId),
        this.employeeProfileService.getExperiencesByUserId(userId),
        this.employeeProfileService.getEducationByUserId(userId),
        this.employeeProfileService.getProjectsByUserId(userId),
        this.employeeProfileService.getCertificationsByUserId(userId),
        this.employeeProfileService.getTrainingsByUserId(userId),
      ]);

      if (!cv) {
        this.logger.warn(`No active profile found for user #${userId}`);
        return { points: 0, status: 'no_profile' };
      }

      const profile: CandidateProfile = {
        cv_id: cv.cv_id,
        full_name: cv.full_name,
        profession: cv.profession,
        email: cv.email,
        address: cv.address,
        skills: cv.skills,
        educations,
        experiences,
        projects,
        certifications,
        trainings,
      };

      // 2. Generate 3 section-grouped chunks
      const chunks = this.chunkingService.chunkCandidate(profile);

      if (chunks.length === 0) {
        this.logger.warn(`No chunks produced for user #${userId}`);
        return { points: 0, status: 'no_profile' };
      }

      // Read active generation and compute target generation (1 -> 2 or 2 -> 1)
      const currentGen = (cv as any).active_generation || 1;
      const targetGen = currentGen === 1 ? 2 : 1; 

      // 3. Compute Embeddings on the Target Generation in background
      const newPoints = await this.embedChunks(chunks, userId, cv.full_name, cv.cv_id, targetGen);

      // 4. Retrieve old point IDs belonging to the old generation
      const oldPointIds = await this.mappingRepository.getVectorPointIdsByGeneration(userId, currentGen);

      // 5. Insert new vectors into Qdrant first (Ensures zero search query downtime!)
      try {
        await this.vectorService.insertBatch(newPoints);
      } catch (err: any) {
        this.logger.error(`Insert failed for user #${userId} on targetGen ${targetGen}. Old index preserved.`);
        await this.mappingRepository.deleteMappingsByGeneration(userId, targetGen).catch(() => {});
        throw err; // Let BullMQ handle automatic retry
      }

      // 6. THE ATOMIC SWAP: Commit the active generation change in PostgreSQL
      await this.mappingRepository.updateActiveGeneration(cv.cv_id, targetGen);

      // 7. SAFE CLEANUP: Purge old generation mappings and Qdrant points
      if (oldPointIds.length > 0) {
        await Promise.all([
          this.vectorService.deletePointsBatch(oldPointIds),
          this.mappingRepository.deleteMappingsByGeneration(userId, currentGen),
        ]).catch(err => {
          this.logger.warn(`Old generation ${currentGen} cleanup failed for user #${userId}: ${err.message}`);
        });
      }

      this.logger.log(`User #${userId} indexed: ${newPoints.length} vectors on Gen ${targetGen}`);
      return { points: newPoints.length, status: 'success' };

    } catch (err: any) {
      this.logger.error(`Re-indexing failed for user #${userId}: ${err.message}`);
      throw err;
    }
  }

 /**
   * Completely purges all vectors and mappings for a deleted user (Gen 1 and Gen 2)
   */
async deleteUserVectors(userId: number): Promise<void> {
    this.logger.log(`Purging vectors for user #${userId}...`);
    try {
      const pointIds = await this.mappingRepository.getAllUserVectorPointIds(userId);
      if (pointIds.length > 0) {
        await this.vectorService.deletePointsBatch(pointIds).catch(() => {});
      }
      await this.mappingRepository.deleteAllUserVectorMappings(userId);
      this.logger.log(`All vectors and mappings purged for user #${userId}.`);
    } catch (err: any) {
      this.logger.warn(`Failed to delete vectors for user #${userId}: ${err.message}`);
    }
  }
  /**
   * Bulk-indexes all active profiles (Called by Worker)
   */
  async indexAllCVs(): Promise<IndexAllResult> {
    this.logger.log('Starting full database re-indexing...');
    await this.vectorService.recreateCollection();
    await this.mappingRepository.clearAllVectorMappings();

    const cvs = await this.employeeProfileService.getAllCVs();
    let totalPointsCount = 0;
    const failedUsers: number[] = [];

    for (let i = 0; i < cvs.length; i++) {
      const cv = cvs[i];
      if (!cv.user_id) continue;

      try {
        const result = await this.reindexUser(cv.user_id);
        if (result.status === 'success') {
          totalPointsCount += result.points;
        }
      } catch (err) {
        failedUsers.push(cv.user_id);
      }
    }

    this.logger.log(`Full index complete: ${cvs.length} users, ${totalPointsCount} vectors.`);
    return { totalUsers: cvs.length, totalPoints: totalPointsCount, failedUsers };
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private async embedChunks(
    chunks: TextChunk[],
    userId: number,
    fullName: string,
    cvId: number,
    targetGen: number,
  ): Promise<VectorPoint[]> {
    return Promise.all(
      chunks.map(async chunk => {
        const chunkType = CHUNK_TYPES[chunk.chunkIndex] ?? 'profile';
        const sourceTable = this.mapTypeToTable(chunkType);

        const [vector, sequentialId] = await Promise.all([
          this.embeddingService.embed(chunk.text),
          this.mappingRepository.getOrCreateMappingId(
            userId,
            sourceTable,
            cvId,
            chunk.chunkIndex,
            targetGen,
          ),
        ]);

        return {
          id: sequentialId,
          vector,
          payload: {
            text: chunk.text,
            type: chunkType,
            user_id: userId,
            entity_id: cvId,
            full_name: fullName,
            source_table: sourceTable,
            generation: targetGen,
            indexed_at: new Date().toISOString(),
          },
        };
      }),
    );
  }

  private mapTypeToTable(type: string): string {
    const mapping: Record<string, string> = {
      profile: 'cvs,educations,experiences', 
      projects: 'projects',       
      credentials: 'certifications,trainings',  
    };
    return mapping[type] ?? 'unknown';
  }
}