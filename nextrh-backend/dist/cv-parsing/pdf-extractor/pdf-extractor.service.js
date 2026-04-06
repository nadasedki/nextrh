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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfExtractorService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const pdfjs = require("pdfjs-dist/legacy/build/pdf");
let PdfExtractorService = class PdfExtractorService {
    async extractTextFromPdf(pdfPath) {
        try {
            const data = new Uint8Array(fs.readFileSync(pdfPath));
            const loadingTask = pdfjs.getDocument({ data, useSystemFonts: true, disableFontFace: true });
            const pdf = await loadingTask.promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map((item) => item.str).join(' ') + '\n';
            }
            return fullText;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Erreur lecture PDF');
        }
    }
    async extractRawText(pdfPath) {
        if (!fs.existsSync(pdfPath))
            throw new common_1.NotFoundException('Fichier PDF introuvable');
        try {
            const data = new Uint8Array(fs.readFileSync(pdfPath));
            const loadingTask = pdfjs.getDocument({ data, useSystemFonts: true, disableFontFace: true });
            const pdf = await loadingTask.promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item) => item.str).join(' ');
                fullText += pageText + '\n';
            }
            console.log("RAW  OUTPUT:", fullText);
            return fullText;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Erreur lecture PDF');
        }
    }
};
exports.PdfExtractorService = PdfExtractorService;
exports.PdfExtractorService = PdfExtractorService = __decorate([
    (0, common_1.Injectable)()
], PdfExtractorService);
//# sourceMappingURL=pdf-extractor.service.js.map