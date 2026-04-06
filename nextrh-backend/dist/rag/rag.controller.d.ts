import { RagService } from './rag.service';
import { VectorService } from './vector.service';
export declare class RagController {
    private ragService;
    private vectorService;
    constructor(ragService: RagService, vectorService: VectorService);
    ask(question: string): Promise<{
        answer: string;
    }>;
    index(): Promise<{
        status: string;
        chunksIndexed: number;
    }>;
}
