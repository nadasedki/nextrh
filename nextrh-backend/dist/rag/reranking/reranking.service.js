"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RerankingService = void 0;
const common_1 = require("@nestjs/common");
let RerankingService = class RerankingService {
    rerank(question, results) {
        const q = question.toLowerCase();
        return results
            .map(r => {
            const text = (r.payload?.text || '').toLowerCase();
            let score = r.score || 0;
            const words = q.split(' ');
            for (const w of words) {
                if (text.includes(w))
                    score += 0.1;
            }
            return { ...r, score };
        })
            .sort((a, b) => b.score - a.score);
    }
};
exports.RerankingService = RerankingService;
exports.RerankingService = RerankingService = __decorate([
    (0, common_1.Injectable)()
], RerankingService);
//# sourceMappingURL=reranking.service.js.map