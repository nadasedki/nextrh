import { Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuid } from 'uuid';

@Injectable()
export class VectorService {
  private client = new QdrantClient({ host: '127.0.0.1', port: 6333 });
  collection = 'cv_rag';

  async upsert(vector: number[], payload: any) {
    await this.client.upsert(this.collection, {
      points: [
        {
          id: uuid(),
          vector,
          payload,
        },
      ],
    });
  }

  async search(vector: number[], topK = 10) {
    return this.client.search(this.collection, {
      vector,
      limit: topK,
      with_payload: true,
    });
  }
  async insertBatch(points: any[]) {
  return await this.client.upsert(this.collection, {
    wait: true,
    points: points,
  });
}

async clearCollection() {
  try {
    await this.client.delete(this.collection, {
      filter: {},
      wait: true,
    });

    console.log('✅ Collection cleared');
  } catch (err) {
    console.error('❌ Error clearing collection:', err.message);
  }
}
async recreateCollection() {
  try {
    const collections = await this.client.getCollections();

    const exists = collections.collections.some(
      c => c.name === this.collection,
    );

    if (exists) {
      await this.client.deleteCollection(this.collection);
    }

    await this.client.createCollection(this.collection, {
      vectors: {
        size: 768,
        distance: 'Cosine',
      },
    });

    console.log('✅ Collection recreated');
  } catch (err) {
    console.error(err);
  }
}


async deleteByEntityId(entityId: number, type: string) {
  return await this.client.delete(this.collection, {
    filter: {
      must: [
        { key: 'entity_id', match: { value: entityId } },
        { key: 'type', match: { value: type } }
      ],
    },
  });
}
}