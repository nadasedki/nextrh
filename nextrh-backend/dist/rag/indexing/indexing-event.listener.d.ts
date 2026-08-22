import { IndexingService } from './indexing.service';
interface EntitySavedPayload {
    entityId: number;
    userId: number;
}
interface EntityDeletedPayload {
    entityId: number;
    userId: number;
}
export declare class IndexingEventListener {
    private readonly indexingService;
    private readonly logger;
    constructor(indexingService: IndexingService);
    handleCvSaved(payload: EntitySavedPayload): Promise<void>;
    handleCvDeleted(payload: EntityDeletedPayload): Promise<void>;
    handleCertificationSaved(payload: EntitySavedPayload): Promise<void>;
    handleCertificationDeleted(payload: EntityDeletedPayload): Promise<void>;
    handleEducationSaved(payload: EntitySavedPayload): Promise<void>;
    handleEducationDeleted(payload: EntityDeletedPayload): Promise<void>;
    handleProjectSaved(payload: EntitySavedPayload): Promise<void>;
    handleProjectDeleted(payload: EntityDeletedPayload): Promise<void>;
    handleExperienceSaved(payload: EntitySavedPayload): Promise<void>;
    handleExperienceDeleted(payload: EntityDeletedPayload): Promise<void>;
    handleTrainingSaved(payload: EntitySavedPayload): Promise<void>;
    handleTrainingDeleted(payload: EntityDeletedPayload): Promise<void>;
    private handle;
}
export {};
