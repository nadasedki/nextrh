import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; 
import { EmployeeProfileService } from 'src/Employee/employeeProfile.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { VectorService, VectorPoint } from '../vector/vector.service';
import { ChunkingService, CandidateProfile, TextChunk } from '../chunking/chunking.service';
import { VectorMappingRepository } from './vector-mapping.repository';

interface ChunkTask {
  chunk: TextChunk;
  type: string;
  entityId: number;
}

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
  ) {}

  /**
   * Re-indexes a single user completely using the optimized, collision-free 3-Vector Strategy [1]
   */
  async reindexUser(userId: number): Promise<ReindexResult> {
    if (!userId) {
      this.logger.error('reindexUser called with no userId');
      return { points: 0, status: 'error', error: 'missing userId' };
    }

    try {
      // 1. Fetch all data in parallel from PostgreSQL [1]
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

      // Assemble full, strictly typed candidate profile [1]
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

      // 2. Generate exactly three section-grouped chunks [1]
      const chunks = this.chunkingService.chunkCandidate(profile);

      if (chunks.length === 0) {
        this.logger.warn(`No chunks produced for user #${userId}`);
        return { points: 0, status: 'no_profile' };
      }

      // Read active generation directly (safe, fast, and now fully type-aligned) [1]
      const currentGen = (cv as any).active_generation || 1;
      const targetGen = currentGen === 1 ? 2 : 1; 

      // 3. Generate embeddings on the target generation (Safe from ID collisions) [1]
      const newPoints = await this.embedChunks(chunks, userId, cv.full_name, cv.cv_id, targetGen);
      
      this.logger.log(
        `[DEBUG-QDRANT] Ready to insert point example: ID=${newPoints[0]?.id}, VectorLength=${newPoints[0]?.vector?.length}`
      );

      // 4. Retrieve old point IDs strictly belonging to the old generation [1]
      const oldPointIds = await this.mappingRepository.getVectorPointIdsByGeneration(userId, currentGen);

      // 5. Insert new vectors into Qdrant first (Ensures zero index query downtime) [1]
      try {
        await this.insertWithRetry(newPoints);
      } catch (err: any) {
        this.logger.error(
          `Insert failed for user #${userId} on targetGen ${targetGen}. Old index preserved.`
        );
        // Clean up target generation mappings to keep DB consistent
        await this.mappingRepository.deleteMappingsByGeneration(userId, targetGen).catch(delErr => {
          this.logger.warn(`Orphan mappings cleanup failed for user #${userId}: ${delErr.message}`);
        });
        return { points: 0, status: 'error', error: err.message };
      }

      // 6. THE ATOMIC SWAP: Commit the active generation change in PostgreSQL [1]
      await this.mappingRepository.updateActiveGeneration(cv.cv_id, targetGen);

      // 7. SAFE CLEANUP: Deletion only removes old generation mappings and Qdrant points [1]
      if (oldPointIds.length > 0) {
        await Promise.all([
          this.deleteWithRetry(oldPointIds),
          this.mappingRepository.deleteMappingsByGeneration(userId, currentGen),
        ]).catch(err => {
          this.logger.warn(
            `Old generation ${currentGen} cleanup failed for user #${userId}: ${err.message}`
          );
        });
      }

      this.logger.log(`User #${userId} indexed: ${newPoints.length} vectors on Gen ${targetGen}`);
      return { points: newPoints.length, status: 'success' };

    } catch (err: any) {
      this.logger.error(`Re-indexing failed for user #${userId}: ${err.message}`);
      return { points: 0, status: 'error', error: err.message };
    }
  }

  /**
   * Bulk-indexes all active profiles, respecting pacing delay configurations [1]
   */
  async indexAllCVs(): Promise<IndexAllResult> {
    this.logger.log('Starting full database re-indexing...');
    await this.vectorService.recreateCollection();
    await this.mappingRepository.clearAllVectorMappings();
    this.logger.log('Collection and mapping tables cleared.');

    const cvs = await this.employeeProfileService.getAllCVs();
    let totalPointsCount = 0;
    const failedUsers: number[] = [];

    // Safe pacing delay configuration to prevent 429 quota exhaustion [1]
    const userDelayMs = this.configService.get<number>('INDEXING_USER_DELAY_MS', 0);

    for (let i = 0; i < cvs.length; i++) {
      const cv = cvs[i];
      if (!cv.user_id) continue;

      const result = await this.reindexUser(cv.user_id);

      if (result.status === 'success') {
        totalPointsCount += result.points;
      } else if (result.status === 'error') {
        failedUsers.push(cv.user_id);
      }

      // Sleep safely between users [1]
      if (userDelayMs > 0 && i < cvs.length - 1) {
        this.logger.debug(`Waiting ${userDelayMs}ms before processing next user...`);
        await new Promise(resolve => setTimeout(resolve, userDelayMs));
      }
    }

    if (failedUsers.length > 0) {
      this.logger.warn(
        `Indexing completed with ${failedUsers.length} failures: [${failedUsers.join(', ')}]`
      );
    }

    this.logger.log(
      `Full index complete: ${cvs.length} users, ${totalPointsCount} vectors, ${failedUsers.length} failures.`
    );

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
        const chunkType  = CHUNK_TYPES[chunk.chunkIndex] ?? 'profile';
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
            text:         chunk.text,
            type:         chunkType,
            user_id:      userId,
            entity_id:    cvId,
            full_name:    fullName,
            source_table: sourceTable,
            generation:   targetGen, // Metadata trace tracking [1]
            indexed_at:   new Date().toISOString(),
          },
        };
      }),
    );
  }

  private async insertWithRetry(points: VectorPoint[], retries = 3, delay = 2000): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.vectorService.insertBatch(points);
        return;
      } catch (err: any) {
        if (i === retries - 1) throw err;
        this.logger.warn(`Vector insert failed (attempt ${i + 1}/${retries}): ${err.message}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private async deleteWithRetry(pointIds: number[], retries = 3, delay = 2000): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.vectorService.deletePointsBatch(pointIds);
        return;
      } catch (err: any) {
        if (i === retries - 1) throw err;
        this.logger.warn(`Vector delete failed (attempt ${i + 1}/${retries}): ${err.message}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
private mapTypeToTable(type: string): string {
  const mapping: Record<string, string> = {
    profile:     'cvs,educations,experiences', 
    projects:    'projects',       
    credentials: 'certifications,trainings',  
  };
  return mapping[type] ?? 'unknown';
}
}