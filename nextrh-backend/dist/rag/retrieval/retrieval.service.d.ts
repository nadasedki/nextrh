import { VectorService } from '../vector/vector.service';
import { EmbeddingService } from '../embedding/embedding.service';
export declare class RetrievalService {
    private vector;
    private embed;
    constructor(vector: VectorService, embed: EmbeddingService);
    retrieve(question: string): Promise<{
        id: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["ExtendedPointId"];
        version: number;
        score: number;
        payload?: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["Payload"] | (Record<string, unknown> | null);
        vector?: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["VectorStructOutput"] | (Record<string, unknown> | null);
        shard_key?: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["ShardKey"] | (Record<string, unknown> | null);
        order_value?: import("@qdrant/js-client-rest/dist/types/openapi/generated_schema").components["schemas"]["OrderValue"] | (Record<string, unknown> | null);
    }[]>;
}
