export interface RagSample {
    id: string;
    question: string;
    contexts: string[];
    answer: string;
    ground_truth?: string | null;
    metadata?: Record<string, any>;
    timestamp?: string;
}
export declare class EvaluationService {
    private filePath;
    log(sample: RagSample): void;
}
