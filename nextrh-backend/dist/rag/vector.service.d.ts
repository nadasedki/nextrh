import { QdrantClient } from '@qdrant/js-client-rest';
export declare class VectorService {
    private client;
    readonly collectionName = "cvs_vectors";
    constructor();
    insertVector(vector: number[], payload: any): Promise<void>;
    search(vector: number[], fullName?: string, topK?: number): Promise<{
        id: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["ExtendedPointId"];
        version: number;
        score: number;
        payload?: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["Payload"] | (Record<string, unknown> | null);
        vector?: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["VectorStructOutput"] | (Record<string, unknown> | null);
        shard_key?: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["ShardKey"] | (Record<string, unknown> | null);
        order_value?: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["OrderValue"] | (Record<string, unknown> | null);
    }[]>;
    deleteCollection(): Promise<void>;
    getClient(): Promise<QdrantClient>;
}
