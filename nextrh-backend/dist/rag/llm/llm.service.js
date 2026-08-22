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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LlmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmService = void 0;
const common_1 = require("@nestjs/common");
const llm_interface_1 = require("../../llm/llm.interface");
let LlmService = LlmService_1 = class LlmService {
    constructor(llmEngine) {
        this.llmEngine = llmEngine;
        this.logger = new common_1.Logger(LlmService_1.name);
        this.logger.log('RAG LlmService initialized using global LLM_ENGINE strategy [2].');
    }
    async generate(prompt, schema) {
        try {
            const parsed = await this.llmEngine.generateStructured(prompt, schema);
            return parsed;
        }
        catch (error) {
            this.logger.error(`LLM generation failed: ${error.message}`);
            throw new common_1.ServiceUnavailableException('The AI inference engine is currently unreachable. Please try again.');
        }
    }
};
exports.LlmService = LlmService;
exports.LlmService = LlmService = LlmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(llm_interface_1.LLM_ENGINE)),
    __metadata("design:paramtypes", [Object])
], LlmService);
//# sourceMappingURL=llm.service.js.map