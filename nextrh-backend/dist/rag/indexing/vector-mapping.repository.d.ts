import { DataSource } from 'typeorm';
export declare class VectorMappingRepository {
    private readonly dbService;
    constructor(dbService: DataSource);
    getOrCreateMappingId(userId: number, sourceTable: string, entityId: number, chunkIndex: number, generation: number): Promise<number>;
    getAllUserVectorPointIds(userId: number): Promise<number[]>;
    deleteAllUserVectorMappings(userId: number): Promise<void>;
    clearAllVectorMappings(): Promise<void>;
    deleteMappingsByIds(ids: number[]): Promise<void>;
    getVectorPointIdsByGeneration(userId: number, generation: number): Promise<number[]>;
    deleteMappingsByGeneration(userId: number, generation: number): Promise<void>;
    updateActiveGeneration(cvId: number, targetGen: number): Promise<void>;
}
