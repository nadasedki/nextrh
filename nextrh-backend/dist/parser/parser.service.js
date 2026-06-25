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
exports.ParserService = void 0;
const common_1 = require("@nestjs/common");
const tesseract = __importStar(require("tesseract.js"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let ParserService = class ParserService {
    async pdfToImages(pdfPath, outputDir = './tmp') {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputPattern = path.join(outputDir, 'page');
        await execAsync(`pdftoppm -png  "${pdfPath}" "${outputPattern}"`);
        const files = fs.readdirSync(outputDir)
            .filter(f => f.endsWith('.png'))
            .map(f => path.join(outputDir, f));
        return files;
    }
    async extractTextFromImage(imagePath) {
        const result = await tesseract.recognize(imagePath, 'eng');
        return {
            text: result.data.text,
            confidence: result.data.confidence
        };
    }
    async extractTextFromPdf(pdfPath) {
        const pages = await this.pdfToImages(pdfPath);
        console.log('Generated pages:', pages);
        let fullText = '';
        let totalConfidence = 0;
        for (const page of pages) {
            const { text, confidence } = await this.extractTextFromImage(page);
            fullText += text + '\n';
            totalConfidence += confidence;
        }
        const averageConfidence = pages.length > 0 ? parseFloat((totalConfidence / pages.length).toFixed(2)) : 0;
        console.log(' AVERAGE OCR CONFIDENCE:', averageConfidence);
        const cleanedText = this.cleanText(fullText);
        console.log('FINAL OCR TEXT:', cleanedText);
        return {
            text: cleanedText,
            confidence: averageConfidence
        };
    }
    cleanText(text) {
        if (!text)
            return '';
        return text
            .replace(/[¥\\|;~`_\[\]{}()]/g, '')
            .replace(/[—_-]{2,}/g, '')
            .split('\n')
            .map(line => {
            let cleanedLine = line.trim();
            cleanedLine = cleanedLine.replace(/\s+[a-zA-Z0-9]$/, '');
            if (cleanedLine.length <= 2 && !/^(at|on|in|by|to|no|ok|is|of)$/i.test(cleanedLine)) {
                return '';
            }
            return cleanedLine;
        })
            .filter(line => line.length > 0)
            .join('\n');
    }
    formatDateToISO(dateStr) {
        if (!dateStr || String(dateStr).trim().toLowerCase() === 'null' || dateStr.trim() === '')
            return null;
        let cleanedStr = dateStr
            .trim()
            .replace(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)[,\s]+/i, '')
            .replace(/janvier/i, 'January').replace(/fevrier/i, 'February').replace(/mars/i, 'March')
            .replace(/avril/i, 'April').replace(/mai/i, 'May').replace(/juin/i, 'June')
            .replace(/juillet/i, 'July').replace(/aout/i, 'August').replace(/septembre/i, 'September')
            .replace(/octobre/i, 'October').replace(/novembre/i, 'November').replace(/decembre/i, 'December');
        const timestamp = Date.parse(cleanedStr);
        if (isNaN(timestamp))
            return dateStr;
        const d = new Date(timestamp);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};
exports.ParserService = ParserService;
exports.ParserService = ParserService = __decorate([
    (0, common_1.Injectable)()
], ParserService);
//# sourceMappingURL=parser.service.js.map