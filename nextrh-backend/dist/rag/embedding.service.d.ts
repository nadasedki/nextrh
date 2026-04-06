export declare class EmbeddingService {
    private readonly ollamaUrl;
    embed(text: string): Promise<number[]>;
}
