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
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const mammoth = __importStar(require("mammoth"));
const puppeteer = __importStar(require("puppeteer"));
const handlebars = __importStar(require("handlebars"));
const axios_1 = __importDefault(require("axios"));
const cv_service_1 = require("../cvs/cv.service");
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
const html_to_docx_1 = __importDefault(require("html-to-docx"));
let CvGenerateService = class CvGenerateService {
    constructor(cvService) {
        this.cvService = cvService;
        this.setupHandlebars();
    }
    setupHandlebars() {
        handlebars.registerHelper('formatDate', (date) => {
            if (!date)
                return 'Présent';
            try {
                return (0, date_fns_1.format)(new Date(date), 'MMMM yyyy', { locale: locale_1.fr });
            }
            catch {
                return date;
            }
        });
        handlebars.registerHelper('eq', function (a, b) {
            return a === b;
        });
    }
    async processSmartPdf(cvId, file) {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir))
            fs.mkdirSync(uploadDir, { recursive: true });
        const timestamp = Date.now();
        const tempDocxPath = path.join(uploadDir, `template_${timestamp}.docx`);
        try {
            if (path.extname(file.originalname).toLowerCase() === '.pdf') {
                const tempPdf = path.join(uploadDir, `in_${timestamp}.pdf`);
                fs.writeFileSync(tempPdf, file.buffer);
                await this.convertPdfToDocx(tempPdf, tempDocxPath);
                fs.unlinkSync(tempPdf);
            }
            else {
                fs.writeFileSync(tempDocxPath, file.buffer);
            }
            const { value: rawHtmlStructure } = await mammoth.convertToHtml({ path: tempDocxPath }, {
                styleMap: [
                    "p[style-name='Heading 1'] => h1.cv-title",
                    "p[style-name='Heading 2'] => h2.cv-section",
                    "table => table.cv-table",
                    "tr => tr",
                    "td => td",
                    "b => strong.bold-text",
                    "i => i.italic-text"
                ]
            });
            console.log('--- HTML EXTRAIT DU DOCX (MAMMOTH) ---');
            console.log(rawHtmlStructure.substring(0, 500) + '...');
            const realData = await this.cvService.getFullCvData(cvId);
            console.log(realData);
            const smartHandlebarsTemplate = await this.askQwenToCreateTemplate(rawHtmlStructure, realData);
            console.log('--- TEMPLATE GÉNÉRÉ PAR L\'IA ---');
            console.log(smartHandlebarsTemplate);
            const compiledTemplate = handlebars.compile(smartHandlebarsTemplate);
            const injectedHtmlFragment = compiledTemplate(realData);
            const finalPdfBuffer = await this.renderDocx(injectedHtmlFragment);
            if (fs.existsSync(tempDocxPath))
                fs.unlinkSync(tempDocxPath);
            return finalPdfBuffer;
        }
        catch (error) {
            console.error('Pipeline Error:', error);
            throw new common_1.InternalServerErrorException(`Erreur: ${error.message}`);
        }
    }
    async askQwenToCreateTemplate(htmlStructure, realData) {
        const prompt = `
[SYSTEM_INSTRUCTION]
Tu es un moteur de transformation de code. Ta tâche est de convertir du HTML statique en un template Handlebars (.hbs) en remplaçant les données textuelles par des balises dynamiques.

--- RÈGLES D'OR (STRICTES) ---
1. INTERDICTION DE RECOPIER : Toute donnée personnelle (nom, entreprise, école, dates, ville) présente dans le HTML source doit être DISPARAITRE et être remplacée par sa balise {{tag}} correspondante.
2. INTÉGRITÉ HTML : Ne modifie AUCUNE balise HTML. Conserve précieusement les <table>, <tr>, <td>, <ul>, <li> et les classes CSS (ex: class="bold-text").
3. LOGIQUE DE RÉPÉTITION :
   - Identifie les blocs qui se répètent (ex: une ligne <tr> qui contient une expérience).
   - Ne garde qu'UN SEUL bloc exemplaire.
   - Enveloppe ce bloc avec {{#each nom_section}} ... {{/each}}.
4. AUCUN TEXTE : Ne fournis aucune explication. La sortie doit commencer par <html> et finir par </html>.

--- MAPPING DES COMPOSANTS ---
- IDENTITÉ : Texte du nom -> {{full_name}}, Texte du poste -> {{profession}}
- CONTACT : Email -> {{email}}, Téléphone -> {{phone}}, Fax -> {{fax}}, Adresse -> {{address}}
- COMPÉTENCES : Groupe de mots-clés -> {{#each skills}} {{this}} {{/each}}

--- STRUCTURES DE BOUCLES (ITÉRATIONS) ---
- EXPÉRIENCES :
  {{#each experiences}}
    Remplacer Poste par: {{role}}
    Remplacer Entreprise par: {{company}}
    Remplacer Dates par: {{formatDate start_date}} - {{formatDate end_date}}
    Remplacer Description par: {{description}}
  {{/each}}

- ÉDUCATION :
  {{#each education}}
    Remplacer Diplôme par: {{degree}}
    Remplacer École par: {{institution}}
    Remplacer Période par: {{start_year}} - {{end_year}}
  {{/each}}

- PROJETS :
  {{#each projects}}
    Remplacer Nom par: {{name}}
    Remplacer Client par: {{client}}
    Remplacer Année par: {{year}}
    Remplacer Description par: {{description}}
  {{/each}}

- CERTIFICATIONS :
  {{#each certifications}}
    Remplacer Nom par: {{cert_name}} | {{provider}} | {{formatDate issue_date}}
  {{/each}}

--- HTML SOURCE À TRAITER ---
${htmlStructure}`;
        try {
            const response = await axios_1.default.post('http://localhost:11434/api/generate', {
                model: 'qwen2.5:7b',
                prompt: prompt,
                stream: false,
                options: { temperature: 0, num_predict: 4000 }
            }, { timeout: 0 });
            let html = response.data.response;
            const firstBracket = html.indexOf('<');
            const lastBracket = html.lastIndexOf('>');
            if (firstBracket !== -1 && lastBracket !== -1) {
                html = html.substring(firstBracket, lastBracket + 1);
            }
            return html.replace(/```html/gi, '').replace(/```/g, '').trim();
        }
        catch (error) {
            console.error('Ollama Error:', error.message);
            throw new Error("L'IA n'a pas pu traiter la structure complexe des données.");
        }
    }
    async renderFinalPdf(content) {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        const fullHtml = `
     <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; }
          
          /* Style pour conserver la structure des tableaux */
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          td { vertical-align: top; padding: 8px; border: 0px solid #eee; } /* Bordures invisibles par défaut comme dans Word */
          
          .cv-title { color: #000; font-size: 26px; border-bottom: 2px solid #000; }
          .cv-section { color: #000; font-size: 18px; margin-top: 25px; border-bottom: 1px solid #e5e7eb; }
          
          /* Pour les listes au cas où */
          ul { padding-left: 20px; }
          li { margin-bottom: 5px; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
        await page.setContent(fullHtml, { waitUntil: 'load' });
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
        });
        await browser.close();
        return Buffer.from(pdf);
    }
    async convertPdfToDocx(input, output) {
        return new Promise((resolve, reject) => {
            const pyPath = 'C:\\Users\\sedki\\Desktop\\NextRH\\nextrh-backend\\python-env\\Scripts\\python.exe';
            const script = path.join(process.cwd(), 'src', 'cv-generate', 'convertpdf.py');
            const pyProcess = (0, child_process_1.spawn)(pyPath, [script, input, output]);
            pyProcess.on('close', (code) => code === 0 ? resolve() : reject(new Error('Conv Error')));
        });
    }
    async renderDocx(content) {
        const styledHtml = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial;
            padding: 30px;
            color: #000;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          td {
            padding: 8px;
            vertical-align: top;
          }

          .cv-title {
            font-size: 26px;
            border-bottom: 2px solid #000;
          }

          .cv-section {
            font-size: 18px;
            border-bottom: 1px solid #000;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;
        const docxBuffer = await (0, html_to_docx_1.default)(styledHtml);
        return docxBuffer;
    }
};
exports.CvGenerateService = CvGenerateService;
exports.CvGenerateService = CvGenerateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_service_1.CvService])
], CvGenerateService);
//# sourceMappingURL=cv-generate.service.js.map