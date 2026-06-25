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
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const parser_service_1 = require("./parser.service");
const llm_service_1 = require("./llm.service");
let AiService = class AiService {
    constructor(ParserService, llmService) {
        this.ParserService = ParserService;
        this.llmService = llmService;
    }
    async extractCertificate(filePath) {
        const { text, confidence } = await this.ParserService.extractTextFromPdf(filePath);
        const data = await this.llmService.extractCertificate(text);
        if (data && !data.error) {
            data.date_of_obtention = this.ParserService.formatDateToISO(data.date_of_obtention) || data.date_of_obtention;
            data.date_of_expiration = this.ParserService.formatDateToISO(data.date_of_expiration);
        }
        return data;
    }
    async extractCertificate2(filePath) {
        const { text, confidence } = await this.ParserService.extractTextFromPdf(filePath);
        const data = await this.llmService.extractCertificate(text);
        if (data && !data.error) {
            data.date_of_obtention = this.ParserService.formatDateToISO(data.date_of_obtention) || data.date_of_obtention;
            data.date_of_expiration = this.ParserService.formatDateToISO(data.date_of_expiration);
        }
        return {
            ...data,
            ocrText: text,
            ocrConfidence: confidence,
        };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [parser_service_1.ParserService,
        llm_service_1.LlmService])
], AiService);
//# sourceMappingURL=ai.service.js.map