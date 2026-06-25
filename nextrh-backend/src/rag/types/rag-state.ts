export interface RagState {
  question: string;

  retrieved: any[];
  reranked: any[];

  prompt?: string;
  answer?: string;

  metadata?: {
    retrievalTime?: number;
    rerankTime?: number;
    llmTime?: number;
  };
}