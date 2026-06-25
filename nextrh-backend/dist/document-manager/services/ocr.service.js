"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var OcrService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrService = void 0;
const common_1 = require("@nestjs/common");
const Tesseract = __importStar(require("tesseract.js"));
const pdfImgConvert = __importStar(require("pdf-img-convert"));
let OcrService = OcrService_1 = class OcrService {
    constructor() {
        this.logger = new common_1.Logger(OcrService_1.name);
    }
    async extractTextFromPdf(pdfBuffer, language = 'fra+eng') {
        this.logger.log('📄 Scanned PDF received. Initiating PDF-to-Image rasterization...');
        try {
            const pageImages = await pdfImgConvert.convert(pdfBuffer, {
                width: 1200,
            });
            this.logger.log(`📄 Rasterization complete. Found ${pageImages.length} pages. Starting sequential OCR...`);
            let aggregatedText = '';
            for (let i = 0; i < pageImages.length; i++) {
                this.logger.log(`🔍 Processing OCR on page ${i + 1}/${pageImages.length}...`);
                const result = await Tesseract.recognize(pageImages[i], language);
                aggregatedText += `\n--- Page ${i + 1} ---\n${result.data.text}`;
            }
            return aggregatedText;
        }
        catch (error) {
            this.logger.error(`Scanned PDF OCR processing failed: ${error.message}`);
            throw new Error(`Échec de l'extraction OCR sur le PDF : ${error.message}`);
        }
    }
};
exports.OcrService = OcrService;
exports.OcrService = OcrService = OcrService_1 = __decorate([
    (0, common_1.Injectable)()
], OcrService);
//# sourceMappingURL=ocr.service.js.map