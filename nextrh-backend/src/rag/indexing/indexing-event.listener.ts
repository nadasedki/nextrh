import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IndexingService } from './indexing.service';

interface EntitySavedPayload   { entityId: number; userId: number; }
interface EntityDeletedPayload { entityId: number; userId: number; }

@Injectable()
export class IndexingEventListener {
  private readonly logger = new Logger(IndexingEventListener.name);

  constructor(private readonly indexingService: IndexingService) {}

  // ─── CVS & PROFILES ────────────────────────────────────────────────────────

  @OnEvent('cv.saved')
  async handleCvSaved(payload: EntitySavedPayload) {
    await this.handle('cv.saved', payload);
  }

  @OnEvent('cv.deleted')
  async handleCvDeleted(payload: EntityDeletedPayload) {
    await this.handle('cv.deleted', payload, true); 
    }

  // ─── CERTIFICATIONS ────────────────────────────────────────────────────────

  @OnEvent('certification.index_saved')
  async handleCertificationSaved(payload: EntitySavedPayload) {
    await this.handle('certification.index_saved', payload);
  }

  @OnEvent('certification.index_deleted')
  async handleCertificationDeleted(payload: EntityDeletedPayload) {
    await this.handle('certification.index_deleted', payload);
  }

  // ─── EDUCATION ─────────────────────────────────────────────────────────────

  @OnEvent('education.saved')
  async handleEducationSaved(payload: EntitySavedPayload) {
    await this.handle('education.saved', payload);
  }

  @OnEvent('education.deleted')
  async handleEducationDeleted(payload: EntityDeletedPayload) {
    await this.handle('education.deleted', payload);
  }

  // ─── PROJECTS ──────────────────────────────────────────────────────────────

  @OnEvent('project.saved')
  async handleProjectSaved(payload: EntitySavedPayload) {
    await this.handle('project.saved', payload);
  }

  @OnEvent('project.deleted')
  async handleProjectDeleted(payload: EntityDeletedPayload) {
    await this.handle('project.deleted', payload);
  }

  // ─── EXPERIENCES ───────────────────────────────────────────────────────────

  @OnEvent('experience.saved')
  async handleExperienceSaved(payload: EntitySavedPayload) {
    await this.handle('experience.saved', payload);
  }

  @OnEvent('experience.deleted')
  async handleExperienceDeleted(payload: EntityDeletedPayload) {
    await this.handle('experience.deleted', payload);
  }

  // ─── TRAININGS ─────────────────────────────────────────────────────────────

  @OnEvent('training.saved')
  async handleTrainingSaved(payload: EntitySavedPayload) {
    await this.handle('training.saved', payload);
  }

  @OnEvent('training.deleted')
  async handleTrainingDeleted(payload: EntityDeletedPayload) {
    await this.handle('training.deleted', payload);
  }

  // ─── SHARED ASYNCHRONOUS HANDLER ───────────────────────────────────────────

  private async handle(
    eventName: string,
    payload: EntitySavedPayload | EntityDeletedPayload,
    isFullDeletion = false,
  ): Promise<void> {
    if (!payload?.userId) {
      this.logger.error(`${eventName} received malformed payload: ${JSON.stringify(payload)}`);
      return;
    }

    try {
      if (isFullDeletion) {
        // 1. Enqueue complete vector cleanup in BullMQ
        this.logger.log(`${eventName} — Enqueueing vector cleanup for User #${payload.userId}`);
        await this.indexingService.enqueueUserDeletion(payload.userId);
      } else {
        // 2. Enqueue background re-indexing in BullMQ (Deduplicated by Redis jobId)
        this.logger.log(`${eventName} — Enqueueing vector re-indexing for User #${payload.userId}`);
        await this.indexingService.enqueueUserIndexing(payload.userId);
      }
    } catch (err: any) {
      this.logger.error(
        `Failed to enqueue vector job for ${eventName} (User #${payload.userId}): ${err.message}`,
      );
    }
  }
}