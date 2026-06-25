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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetrievalService = void 0;
const common_1 = require("@nestjs/common");
const vector_service_1 = require("../vector/vector.service");
const embedding_service_1 = require("../embedding/embedding.service");
let RetrievalService = class RetrievalService {
    constructor(vector, embed) {
        this.vector = vector;
        this.embed = embed;
    }
    async retrieve(question) {
        const qVec = await this.embed.embed(question);
        return this.vector.search(qVec, 20);
    }
};
exports.RetrievalService = RetrievalService;
exports.RetrievalService = RetrievalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [vector_service_1.VectorService,
        embedding_service_1.EmbeddingService])
], RetrievalService);
//# sourceMappingURL=retrieval.service.js.map