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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvGenerateService = void 0;
const common_1 = require("@nestjs/common");
const mammoth = __importStar(require("mammoth"));
const puppeteer = __importStar(require("puppeteer"));
const axios_1 = __importDefault(require("axios"));
const cv_service_1 = require("../cvs/cv.service");
let CvGenerateService = class CvGenerateService {
    constructor(cvService) {
        this.cvService = cvService;
    }
    async processSmartPdf(cvId, file) {
        try {
            const { value: templateHtml } = await mammoth.convertToHtml({ buffer: file.buffer });
            const realData = await this.cvService.getFullCvData(cvId);
            const mapping = await this.getMappingFromAI(templateHtml, realData);
            let finalHtml = templateHtml;
            for (const [oldText, newText] of Object.entries(mapping)) {
                if (oldText && oldText.length > 2) {
                    finalHtml = finalHtml.split(oldText).join(String(newText));
                }
            }
            return await this.renderPdf(finalHtml);
        }
        catch (error) {
            console.error('Erreur:', error.message);
            throw new common_1.InternalServerErrorException("Échec de la génération rapide.");
        }
    }
    async getMappingFromAI(templateHtml, data) {
        const prompt = `
      Tu es un expert en mapping de données. Voici un template de CV :
      "${templateHtml.substring(0, 2000)}"

      Voici les données réelles :
      Nom: ${data.full_name}, Poste: ${data.profession}, Contact: ${data.email}, ${data.phone}.
      Expériences: ${data.experiences.map(e => e.role).join(', ')}.

      MISSION : 
      Identifie les textes d'exemple du template et crée un dictionnaire JSON de remplacement.
      RETOURNE UNIQUEMENT LE JSON PLAT.
      Exemple: {"LUCAS LEBLANC": "ANOUAR ABDALLAH"}
    `;
        const response = await axios_1.default.post('http://localhost:11434/api/generate', {
            model: 'qwen2.5:1.5b',
            prompt: prompt,
            stream: false,
            format: 'json',
            options: { temperature: 0 }
        });
        return JSON.parse(response.data.response);
    }
    async renderPdf(content) {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        const styledHtml = `
      <style>
        body { font-family: sans-serif; line-height: 1.5; color: #333; padding: 40px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px; vertical-align: top; border-bottom: 1px solid #eee; }
        h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; }
      </style>
      ${content}
    `;
        await page.setContent(styledHtml, { waitUntil: 'load' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();
        return Buffer.from(pdf);
    }
};
exports.CvGenerateService = CvGenerateService;
exports.CvGenerateService = CvGenerateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_service_1.CvService])
], CvGenerateService);
//# sourceMappingURL=cv-generate.service.js.map