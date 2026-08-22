// src/rag/indexing/vector-mapping.repository.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class VectorMappingRepository {
  constructor(private readonly dbService: DataSource) {}

async getOrCreateMappingId(
    userId: number, 
    sourceTable: string, 
    entityId: number, 
    chunkIndex: number,
    generation: number
  ): Promise<number> {
    const query = `
      INSERT INTO vector_mappings (user_id, source_table, entity_id, chunk_index, generation)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, source_table, entity_id, chunk_index, generation) 
      DO UPDATE SET indexed_at = NOW()
      RETURNING id;
    `;
    const res = await this.dbService.query(query, [userId, sourceTable, entityId, chunkIndex, generation]);
    return Number(res[0].id);
  }

  async getAllUserVectorPointIds(userId: number): Promise<number[]> {
    const query = `SELECT id FROM vector_mappings WHERE user_id = $1;`;
    const res = await this.dbService.query(query, [userId]);
    return res.map((row: any) => Number(row.id));
  }

  async deleteAllUserVectorMappings(userId: number): Promise<void> {
    const query = `DELETE FROM vector_mappings WHERE user_id = $1;`;
    await this.dbService.query(query, [userId]);
  }

  async clearAllVectorMappings(): Promise<void> {
    await this.dbService.query(`TRUNCATE TABLE vector_mappings RESTART IDENTITY;`);
  }
  /**
   * Deletes specific vector mapping records by their primary key IDs.
   * This is used during atomic blue-green indexing to clean up only the stale mappings.
   */
  async deleteMappingsByIds(ids: number[]): Promise<void> {
    // 1. Guard clause: If there are no IDs to delete, return immediately
    if (!ids || ids.length === 0) {
      return;
    }

    // 2. PostgreSQL "= ANY($1)" pattern is the safest and cleanest way 
    // to handle array comparisons in raw SQL without dynamic string concatenation.
    const query = `DELETE FROM vector_mappings WHERE id = ANY($1);`;
    
    // We pass the entire 'ids' array as the single $1 parameter
    await this.dbService.query(query, [ids]);
  }
   /**
   * Fetches all point IDs belonging to a specific generation
   */
  async getVectorPointIdsByGeneration(userId: number, generation: number): Promise<number[]> {
    const query = `SELECT id FROM vector_mappings WHERE user_id = $1 AND generation = $2;`;
    const res = await this.dbService.query(query, [userId, generation]);
    return res.map((row: any) => Number(row.id));
  }

  /**
   * Deletes only the mappings belonging to a specific generation
   */
  async deleteMappingsByGeneration(userId: number, generation: number): Promise<void> {
    const query = `DELETE FROM vector_mappings WHERE user_id = $1 AND generation = $2;`;
    await this.dbService.query(query, [userId, generation]);
  }

  /**
   * Atomically switches the active generation pointer on the CV record
   */
  async updateActiveGeneration(cvId: number, targetGen: number): Promise<void> {
    const query = `UPDATE cvs SET active_generation = $1 WHERE cv_id = $2;`;
    await this.dbService.query(query, [targetGen, cvId]);
  }

  
}