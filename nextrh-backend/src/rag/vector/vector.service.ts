// src/rag/vector/vector.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

export interface VectorPoint {
  id: number; 
  vector: number[];
  payload: {
    text: string;
    type: string;          // e.g., 'experience', 'project', 'certification', 'profile', 'skills'
    user_id: number;
    entity_id: number;
    full_name: string;
    source_table: string;
    indexed_at: string; 
    generation :number ;   // ISO Date string tracking mapping generation timestamps
  };
}

@Injectable()
export class VectorService implements OnModuleInit {
  private readonly logger = new Logger(VectorService.name);
  private readonly client: QdrantClient;
  private readonly collection: string;
  private readonly VECTOR_SIZE = 1024; //768//// Matches nomic-embed-text/Ollama dimensions

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('QDRANT_HOST', '127.0.0.1');
    const port = this.configService.get<number>('QDRANT_PORT', 6333);
    this.collection = this.configService.get<string>('QDRANT_COLLECTION', 'user_profiles');

    this.client = new QdrantClient({ host, port });

    this.logger.log(
      `Qdrant client initialized on ${host}:${port} targeting collection "${this.collection}"`
    );
  }

  /**
   * Automatically asserts collection infrastructure is live on app startup
   */
  async onModuleInit() {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(c => c.name === this.collection);

      if (exists) {
        this.logger.log(`Collection "${this.collection}" is online.`);
      } else {
        this.logger.warn(`Collection "${this.collection}" missing. Initializing auto-creation...`);
        await this.recreateCollection();
      }
    } catch (err: any) {
      this.logger.error(`Failed to connect to Qdrant during initialization: ${err.message}`);
    }
  }

  /**
   * Queries vector space embeddings for nearest neighbor extraction
   */
  async search(vector: number[], topK = 10) {
    try {
      return await this.client.search(this.collection, {
        vector: vector,
        limit: Math.max(1, Math.floor(Number(topK))),
        with_payload: true,
      });
    } catch (err: any) {
      this.logger.error(`Vector search failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Persists a batch array of numeric points into the vector space
   */
  async insertBatch(points: VectorPoint[]) {
    if (!points || points.length === 0) return;
    
    try {
      return await this.client.upsert(this.collection, {
        wait: true,
        points,
      });
    } catch (err: any) {
      this.logger.error(`Batch insert failed (${points.length} points): ${err.message}`);
      throw err;
    }
  }

  /**
   * Purges a specific vector point by its relational mapping ID
   */
  async deletePoint(pointId: number) {
    try {
      return await this.client.delete(this.collection, {
        wait: true,
        points: [pointId],
      });
    } catch (err: any) {
      this.logger.error(`Failed to delete point ID #${pointId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Bulk-deletes an array of vector mapping references from Qdrant
   */
  async deletePointsBatch(pointIds: number[]) {
    if (!pointIds || pointIds.length === 0) return;
    try {
      return await this.client.delete(this.collection, {
        wait: true,
        points: pointIds,
      });
    } catch (err: any) {
      this.logger.error(`Batch deletion failed for ${pointIds.length} points: ${err.message}`);
      throw err;
    }
  }

  /**
   * Recreates the collection schema from scratch (destructive reset)
   */
  async recreateCollection() {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(c => c.name === this.collection);

      if (exists) {
        await this.client.deleteCollection(this.collection);
        this.logger.log(`Dropped old collection trace: "${this.collection}"`);
      }

      await this.client.createCollection(this.collection, {
        vectors: {
          size: this.VECTOR_SIZE,
          distance: 'Cosine',
        },
      });

      this.logger.log(`Successfully deployed collection "${this.collection}" (Size: ${this.VECTOR_SIZE}, Metric: Cosine)`);
    } catch (err: any) {
      this.logger.error(`Failed to recreate collection "${this.collection}": ${err.message}`);
      throw err;
    }
  }
}