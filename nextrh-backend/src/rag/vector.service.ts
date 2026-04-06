import { Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VectorService {
  private client: QdrantClient;
  public readonly collectionName = 'cvs_vectors';

  constructor() {
    // 127.0.0.1 est plus robuste que 'localhost' pour éviter l'erreur "fetch failed"
    this.client = new QdrantClient({ host: '127.0.0.1', port: 6333 });
  }

  async insertVector(vector: number[], payload: any) {
    try {
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: [
          {
            id: uuidv4(), 
            vector: vector,
            payload: payload,
          },
        ],
      });
    } catch (err) {
      console.error(`Erreur insertion Qdrant: ${err.message}`);
    }
  }

  async search(vector: number[], fullName?: string, topK = 7) {
    try {
      const filter = fullName ? {
        must: [
          {
            key: 'full_name',
            match: { value: fullName },
          },
        ],
      } : undefined;

      return await this.client.search(this.collectionName, {
        vector,
        filter: filter,
        limit: topK,
        with_payload: true,
        score_threshold: 0.35, // PRO : Ignore les résultats trop éloignés (bruit)
      });
    } catch (err) {
      console.error(`Erreur recherche Qdrant: ${err.message}`);
      return [];
    }
  }

  async deleteCollection() {
    try {
      await this.client.deleteCollection(this.collectionName);
    } catch (e) {}
  }

  async getClient() { return this.client; }
}