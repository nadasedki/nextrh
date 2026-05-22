import { ParserService } from '../../parser/parser.service';
import { LlmService } from '../../parser/llm.service';
export declare class EvaluationService {
    private readonly parserService;
    private readonly llmService;
    constructor(parserService: ParserService, llmService: LlmService);
    private calculateSimilarity;
    runTargetedEvaluation(targetType: string): Promise<void>;
}
