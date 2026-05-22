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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const cv_service_1 = require("../cvs/cv.service");
const puppeteer = __importStar(require("puppeteer"));
const handlebars = __importStar(require("handlebars"));
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
let CvGeneratorService = class CvGeneratorService {
    constructor(cvService) {
        this.cvService = cvService;
        if (!handlebars.helpers.formatDate) {
            handlebars.registerHelper('formatDate', (date) => {
                if (!date)
                    return '';
                try {
                    const d = new Date(date);
                    if (isNaN(d.getTime()))
                        return date;
                    return (0, date_fns_1.format)(d, 'MMMM yyyy', { locale: locale_1.fr });
                }
                catch (e) {
                    return date;
                }
            });
        }
        if (!handlebars.helpers.join) {
            handlebars.registerHelper('join', (array, sep) => {
                if (!Array.isArray(array))
                    return '';
                return array.join(sep || ', ');
            });
        }
    }
    async generateSmartPdf(cvId, templateHtml) {
        try {
            const data = await this.cvService.getFullCvData(cvId);
            const template = handlebars.compile(templateHtml);
            const htmlWithData = template(data);
            const browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                ],
            });
            const page = await browser.newPage();
            await page.setContent(htmlWithData, { waitUntil: 'networkidle0', timeout: 60000 });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '15mm',
                    right: '15mm',
                    bottom: '15mm',
                    left: '15mm',
                },
            });
            await browser.close();
            return Buffer.from(pdfBuffer);
        }
        catch (error) {
            console.error('Erreur lors de la génération du PDF:', error.message);
            throw new common_1.InternalServerErrorException(`Erreur de génération du document : ${error.message}`);
        }
    }
};
exports.CvGeneratorService = CvGeneratorService;
exports.CvGeneratorService = CvGeneratorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_service_1.CvService])
], CvGeneratorService);
//# sourceMappingURL=cv-generator.service.js.map