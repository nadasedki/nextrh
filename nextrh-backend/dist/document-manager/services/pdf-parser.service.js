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
var PdfParserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfParserService = void 0;
const common_1 = require("@nestjs/common");
const pdf_parse_1 = require("pdf-parse");
let PdfParserService = PdfParserService_1 = class PdfParserService {
    constructor() {
        this.logger = new common_1.Logger(PdfParserService_1.name);
        this.MAX_SINGLE_PASS_LENGTH = 12000;
    }
    async extractRawText(fileBuffer) {
        this.logger.log('📄 Extracting raw PDF text string...');
        const parser = new pdf_parse_1.PDFParse({ data: fileBuffer });
        try {
            const result = await parser.getText();
            const rawText = result.text;
            this.logger.log(`RAW TEXT:\n${rawText}`);
            return rawText;
        }
        finally {
            await parser.destroy();
        }
    }
};
exports.PdfParserService = PdfParserService;
exports.PdfParserService = PdfParserService = PdfParserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PdfParserService);
//# sourceMappingURL=pdf-parser.service.js.map