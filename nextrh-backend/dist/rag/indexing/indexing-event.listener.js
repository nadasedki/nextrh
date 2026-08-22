"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IndexingEventListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexingEventListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const indexing_service_1 = require("./indexing.service");
let IndexingEventListener = IndexingEventListener_1 = class IndexingEventListener {
    constructor(indexingService) {
        this.indexingService = indexingService;
        this.logger = new common_1.Logger(IndexingEventListener_1.name);
    }
    async handleCvSaved(payload) {
        await this.handle('cv.saved', payload);
    }
    async handleCvDeleted(payload) {
        await this.handle('cv.deleted', payload);
    }
    async handleCertificationSaved(payload) {
        await this.handle('certification.index_saved', payload);
    }
    async handleCertificationDeleted(payload) {
        await this.handle('certification.index_deleted', payload);
    }
    async handleEducationSaved(payload) {
        await this.handle('education.saved', payload);
    }
    async handleEducationDeleted(payload) {
        await this.handle('education.deleted', payload);
    }
    async handleProjectSaved(payload) {
        await this.handle('project.saved', payload);
    }
    async handleProjectDeleted(payload) {
        await this.handle('project.deleted', payload);
    }
    async handleExperienceSaved(payload) {
        await this.handle('experience.saved', payload);
    }
    async handleExperienceDeleted(payload) {
        await this.handle('experience.deleted', payload);
    }
    async handleTrainingSaved(payload) {
        await this.handle('training.saved', payload);
    }
    async handleTrainingDeleted(payload) {
        await this.handle('training.deleted', payload);
    }
    async handle(eventName, payload) {
        if (!payload?.userId || !payload?.entityId) {
            this.logger.error(`${eventName} received malformed payload: ${JSON.stringify(payload)}`);
            return;
        }
        this.logger.log(`${eventName} — entity #${payload.entityId}, user #${payload.userId}`);
        try {
            const result = await this.indexingService.reindexUser(payload.userId);
            if (result.status === 'error') {
                this.logger.error(`Re-index failed after ${eventName} for user #${payload.userId}: ${result.error}`);
            }
            else if (result.status === 'no_profile') {
                this.logger.warn(`No profile found for user #${payload.userId} — skipping re-index`);
            }
            else {
                this.logger.log(`Re-index complete after ${eventName} for user #${payload.userId} (${result.points} vectors)`);
            }
        }
        catch (err) {
            this.logger.error(`Unexpected error in ${eventName} handler for user #${payload.userId}: ${err.message}`);
        }
    }
};
exports.IndexingEventListener = IndexingEventListener;
__decorate([
    (0, event_emitter_1.OnEvent)('cv.saved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingEventListener.prototype, "handleCvSaved", null);
__decorate([
    (0, event_emitter_1.OnEvent)('cv.deleted'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingEventListener.prototype, "handleCvDeleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('certification.index_saved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingEventListener.prototype, "handleCertificationSaved", null);
__decorate([
    (0, event_emitter_1.OnEvent)('certification.index_deleted'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingEventListener.prototype, "handleCertificationDeleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('education.saved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingEventListener.prototype, "handleEducationSaved", null);
__decorate([
    (0, event_emitter_1.OnEvent)('education.deleted'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingEventListener.prototype, "handleEducationDeleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('project.saved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingEventListener.prototype, "handleProjectSaved", null);
__decorate([
    (0, event_emitter_1.OnEvent)('project.deleted'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingEventListener.prototype, "handleProjectDeleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('experience.saved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingEventListener.prototype, "handleExperienceSaved", null);
__decorate([
    (0, event_emitter_1.OnEvent)('experience.deleted'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingEventListener.prototype, "handleExperienceDeleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('training.saved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingEventListener.prototype, "handleTrainingSaved", null);
__decorate([
    (0, event_emitter_1.OnEvent)('training.deleted'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingEventListener.prototype, "handleTrainingDeleted", null);
exports.IndexingEventListener = IndexingEventListener = IndexingEventListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [indexing_service_1.IndexingService])
], IndexingEventListener);
//# sourceMappingURL=indexing-event.listener.js.map