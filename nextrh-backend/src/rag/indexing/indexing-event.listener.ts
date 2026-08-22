// src/rag/indexing/indexing-event.listener.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IndexingService } from './indexing.service';

interface EntitySavedPayload   { entityId: number; userId: number; }
interface EntityDeletedPayload { entityId: number; userId: number; }

@Injectable()
export class IndexingEventListener {
  private readonly logger = new Logger(IndexingEventListener.name);

  constructor(private readonly indexingService: IndexingService) {}

  // ─── CVS & PROFILES (Added to handle core CV integrations) ─────────────────

  @OnEvent('cv.saved') // ◄ Listens to CV creation/import updates [1]
  async handleCvSaved(payload: EntitySavedPayload) {
    await this.handle('cv.saved', payload);
  }

  @OnEvent('cv.deleted') // ◄ Listens to CV deletion/wipe updates [1]
  async handleCvDeleted(payload: EntityDeletedPayload) {
    await this.handle('cv.deleted', payload);
  }
  // ─── CERTIFICATIONS ─────────────────────────────────────────────────────────

  @OnEvent('certification.index_saved')
  async handleCertificationSaved(payload: EntitySavedPayload) {
    await this.handle('certification.index_saved', payload);
  }

  @OnEvent('certification.index_deleted')
  async handleCertificationDeleted(payload: EntityDeletedPayload) {
    await this.handle('certification.index_deleted', payload);
  }

  // ─── EDUCATION ──────────────────────────────────────────────────────────────

  @OnEvent('education.saved')
  async handleEducationSaved(payload: EntitySavedPayload) {
    await this.handle('education.saved', payload);
  }

  @OnEvent('education.deleted')
  async handleEducationDeleted(payload: EntityDeletedPayload) {
    await this.handle('education.deleted', payload);
  }

  // ─── PROJECTS ───────────────────────────────────────────────────────────────

  @OnEvent('project.saved')
  async handleProjectSaved(payload: EntitySavedPayload) {
    await this.handle('project.saved', payload);
  }

  @OnEvent('project.deleted')
  async handleProjectDeleted(payload: EntityDeletedPayload) {
    await this.handle('project.deleted', payload);
  }

  // ─── EXPERIENCES ────────────────────────────────────────────────────────────

  @OnEvent('experience.saved')
  async handleExperienceSaved(payload: EntitySavedPayload) {
    await this.handle('experience.saved', payload);
  }

  @OnEvent('experience.deleted')
  async handleExperienceDeleted(payload: EntityDeletedPayload) {
    await this.handle('experience.deleted', payload);
  }

  // ─── TRAININGS ──────────────────────────────────────────────────────────────

  @OnEvent('training.saved')
  async handleTrainingSaved(payload: EntitySavedPayload) {
    await this.handle('training.saved', payload);
  }

  @OnEvent('training.deleted')
  async handleTrainingDeleted(payload: EntityDeletedPayload) {
    await this.handle('training.deleted', payload);
  }

  // ─── SHARED HANDLER ─────────────────────────────────────────────────────────

  // all events funnel through here — validation, logging, error isolation
  // event handlers must never throw — they are side effects of business operations
  private async handle(
    eventName: string,
    payload: EntitySavedPayload | EntityDeletedPayload,
  ): Promise<void> {
    // validate payload before touching the service
    if (!payload?.userId || !payload?.entityId) {
      this.logger.error(
        `${eventName} received malformed payload: ${JSON.stringify(payload)}`,
      );
      return;
    }

    this.logger.log(
      `${eventName} — entity #${payload.entityId}, user #${payload.userId}`,
    );

    try {
      const result = await this.indexingService.reindexUser(payload.userId);

      if (result.status === 'error') {
        this.logger.error(
          `Re-index failed after ${eventName} for user #${payload.userId}: ${result.error}`,
        );
      } else if (result.status === 'no_profile') {
        this.logger.warn(
          `No profile found for user #${payload.userId} — skipping re-index`,
        );
      } else {
        this.logger.log(
          `Re-index complete after ${eventName} for user #${payload.userId} (${result.points} vectors)`,
        );
      }
    } catch (err: any) {
      // catch-all safety net — should never reach here since reindexUser catches internally
      this.logger.error(
        `Unexpected error in ${eventName} handler for user #${payload.userId}: ${err.message}`,
      );
    }
  }
}