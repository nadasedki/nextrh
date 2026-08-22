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
var VectorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const js_client_rest_1 = require("@qdrant/js-client-rest");
let VectorService = VectorService_1 = class VectorService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(VectorService_1.name);
        this.VECTOR_SIZE = 1024;
        const host = this.configService.get('QDRANT_HOST', '127.0.0.1');
        const port = this.configService.get('QDRANT_PORT', 6333);
        this.collection = this.configService.get('QDRANT_COLLECTION', 'user_profiles');
        this.client = new js_client_rest_1.QdrantClient({ host, port });
        this.logger.log(`Qdrant client initialized on ${host}:${port} targeting collection "${this.collection}"`);
    }
    async onModuleInit() {
        try {
            const collections = await this.client.getCollections();
            const exists = collections.collections.some(c => c.name === this.collection);
            if (exists) {
                this.logger.log(`Collection "${this.collection}" is online.`);
            }
            else {
                this.logger.warn(`Collection "${this.collection}" missing. Initializing auto-creation...`);
                await this.recreateCollection();
            }
        }
        catch (err) {
            this.logger.error(`Failed to connect to Qdrant during initialization: ${err.message}`);
        }
    }
    async search(vector, topK = 10) {
        try {
            return await this.client.search(this.collection, {
                vector: vector,
                limit: Math.max(1, Math.floor(Number(topK))),
                with_payload: true,
            });
        }
        catch (err) {
            this.logger.error(`Vector search failed: ${err.message}`);
            throw err;
        }
    }
    async insertBatch(points) {
        if (!points || points.length === 0)
            return;
        try {
            return await this.client.upsert(this.collection, {
                wait: true,
                points,
            });
        }
        catch (err) {
            this.logger.error(`Batch insert failed (${points.length} points): ${err.message}`);
            throw err;
        }
    }
    async deletePoint(pointId) {
        try {
            return await this.client.delete(this.collection, {
                wait: true,
                points: [pointId],
            });
        }
        catch (err) {
            this.logger.error(`Failed to delete point ID #${pointId}: ${err.message}`);
            throw err;
        }
    }
    async deletePointsBatch(pointIds) {
        if (!pointIds || pointIds.length === 0)
            return;
        try {
            return await this.client.delete(this.collection, {
                wait: true,
                points: pointIds,
            });
        }
        catch (err) {
            this.logger.error(`Batch deletion failed for ${pointIds.length} points: ${err.message}`);
            throw err;
        }
    }
    async recreateCollection() {
        try {
            const collections = await this.client.getCollections();
            const exists = collections.collections.some(c => c.name === this.collection);
            if (exists) {
                await this.client.deleteCollection(this.collection);
                this.logger.log(`Dropped old collection trace: "${this.collection}"`);
            }
            await this.client.createCollection(this.collection, {
                vectors: {
                    size: this.VECTOR_SIZE,
                    distance: 'Cosine',
                },
            });
            this.logger.log(`Successfully deployed collection "${this.collection}" (Size: ${this.VECTOR_SIZE}, Metric: Cosine)`);
        }
        catch (err) {
            this.logger.error(`Failed to recreate collection "${this.collection}": ${err.message}`);
            throw err;
        }
    }
};
exports.VectorService = VectorService;
exports.VectorService = VectorService = VectorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], VectorService);
//# sourceMappingURL=vector.service.js.map