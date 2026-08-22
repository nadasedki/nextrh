import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface VectorPoint {
    id: number;
    vector: number[];
    payload: {
        text: string;
        type: string;
        user_id: number;
        entity_id: number;
        full_name: string;
        source_table: string;
        indexed_at: string;
        generation: number;
    };
}
export declare class VectorService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private readonly client;
    private readonly collection;
    private readonly VECTOR_SIZE;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    search(vector: number[], topK?: number): Promise<{
        id: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["ExtendedPointId"];
        version: number;
        score: number;
        payload?: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["Payload"] | (Record<string, unknown> | null);
        vector?: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["VectorStructOutput"] | (Record<string, unknown> | null);
        shard_key?: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["ShardKey"] | (Record<string, unknown> | null);
        order_value?: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["OrderValue"] | (Record<string, unknown> | null);
    }[]>;
    insertBatch(points: VectorPoint[]): Promise<{
        operation_id?: number | null;
        status: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["UpdateStatus"];
    }>;
    deletePoint(pointId: number): Promise<{
        operation_id?: number | null;
        status: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["UpdateStatus"];
    }>;
    deletePointsBatch(pointIds: number[]): Promise<{
        operation_id?: number | null;
        status: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["UpdateStatus"];
    }>;
    recreateCollection(): Promise<void>;
}
