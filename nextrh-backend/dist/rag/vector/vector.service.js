"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorService = void 0;
const common_1 = require("@nestjs/common");
const js_client_rest_1 = require("@qdrant/js-client-rest");
const uuid_1 = require("uuid");
let VectorService = class VectorService {
    constructor() {
        this.client = new js_client_rest_1.QdrantClient({ host: '127.0.0.1', port: 6333 });
        this.collection = 'cv_rag';
    }
    async upsert(vector, payload) {
        await this.client.upsert(this.collection, {
            points: [
                {
                    id: (0, uuid_1.v4)(),
                    vector,
                    payload,
                },
            ],
        });
    }
    async search(vector, topK = 10) {
        return this.client.search(this.collection, {
            vector,
            limit: topK,
            with_payload: true,
        });
    }
    async insertBatch(points) {
        return await this.client.upsert(this.collection, {
            wait: true,
            points: points,
        });
    }
    async clearCollection() {
        try {
            await this.client.delete(this.collection, {
                filter: {},
                wait: true,
            });
            console.log('✅ Collection cleared');
        }
        catch (err) {
            console.error('❌ Error clearing collection:', err.message);
        }
    }
    async recreateCollection() {
        try {
            const collections = await this.client.getCollections();
            const exists = collections.collections.some(c => c.name === this.collection);
            if (exists) {
                await this.client.deleteCollection(this.collection);
            }
            await this.client.createCollection(this.collection, {
                vectors: {
                    size: 768,
                    distance: 'Cosine',
                },
            });
            console.log('✅ Collection recreated');
        }
        catch (err) {
            console.error(err);
        }
    }
    async deleteByEntityId(entityId, type) {
        return await this.client.delete(this.collection, {
            filter: {
                must: [
                    { key: 'entity_id', match: { value: entityId } },
                    { key: 'type', match: { value: type } }
                ],
            },
        });
    }
};
exports.VectorService = VectorService;
exports.VectorService = VectorService = __decorate([
    (0, common_1.Injectable)()
], VectorService);
//# sourceMappingURL=vector.service.js.map