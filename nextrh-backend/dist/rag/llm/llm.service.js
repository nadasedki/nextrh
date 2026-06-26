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
exports.LlmService = void 0;
const common_1 = require("@nestjs/common");
const ollama_1 = require("@langchain/ollama");
const config_1 = require("@nestjs/config");
let LlmService = class LlmService {
    constructor(configService) {
        this.configService = configService;
        this.chatModel = new ollama_1.ChatOllama({
            baseUrl: this.configService.get('OLLAMA_BASE_URL', 'http://127.0.0.1:11434'),
            model: this.configService.get('OLLAMA_MODEL', 'qwen2.5:7b'),
        });
    }
    async generate(prompt) {
        try {
            const response = await this.chatModel.invoke(prompt);
            return response.content;
        }
        catch (error) {
            throw new common_1.ServiceUnavailableException('The AI Inference engine is currently unreachable. Please try again.');
        }
    }
};
exports.LlmService = LlmService;
exports.LlmService = LlmService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LlmService);
//# sourceMappingURL=llm.service.js.map