export declare class VectorService {
    private client;
    collection: string;
    upsert(vector: number[], payload: any): Promise<void>;
    search(vector: number[], topK?: number): Promise<{
        id: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["ExtendedPointId"];
        version: number;
        score: number;
        payload?: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["Payload"] | (Record<string, unknown> | null);
        vector?: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["VectorStructOutput"] | (Record<string, unknown> | null);
        shard_key?: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["ShardKey"] | (Record<string, unknown> | null);
        order_value?: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["OrderValue"] | (Record<string, unknown> | null);
    }[]>;
    insertBatch(points: any[]): Promise<{
        operation_id?: number | null;
        status: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["UpdateStatus"];
    }>;
    clearCollection(): Promise<void>;
    recreateCollection(): Promise<void>;
    deleteByEntityId(entityId: number, type: string): Promise<{
        operation_id?: number | null;
        status: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["UpdateStatus"];
    }>;
}
