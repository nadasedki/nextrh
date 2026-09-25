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
var VectorIndexingProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorIndexingProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const indexing_service_1 = require("../indexing.service");
let VectorIndexingProcessor = VectorIndexingProcessor_1 = class VectorIndexingProcessor extends bullmq_1.WorkerHost {
    constructor(indexingService) {
        super();
        this.indexingService = indexingService;
        this.logger = new common_1.Logger(VectorIndexingProcessor_1.name);
    }
    async process(job) {
        this.logger.log(`[Job #${job.id}] Processing vector task: "${job.name}"...`);
        switch (job.name) {
            case 'index-user': {
                const { userId } = job.data;
                await job.updateProgress(25);
                const result = await this.indexingService.reindexUser(userId);
                await job.updateProgress(100);
                this.logger.log(`[Job #${job.id}] User #${userId} indexed successfully (${result.points} vectors)`);
                return result;
            }
            case 'reindex-all': {
                await job.updateProgress(10);
                const result = await this.indexingService.indexAllCVs();
                await job.updateProgress(100);
                this.logger.log(`[Job #${job.id}] Full database re-indexing complete!`);
                return result;
            }
            case 'delete-user-vectors': {
                const { userId } = job.data;
                await this.indexingService.deleteUserVectors(userId);
                this.logger.log(`[Job #${job.id}] User #${userId} vectors deleted successfully.`);
                return { status: 'deleted', userId };
            }
            default:
                this.logger.warn(`[Job #${job.id}] Unknown vector job name: ${job.name}`);
                return null;
        }
    }
};
exports.VectorIndexingProcessor = VectorIndexingProcessor;
exports.VectorIndexingProcessor = VectorIndexingProcessor = VectorIndexingProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('vector-indexing', { concurrency: 1 }),
    __metadata("design:paramtypes", [indexing_service_1.IndexingService])
], VectorIndexingProcessor);
//# sourceMappingURL=vector-indexing.processor.js.map