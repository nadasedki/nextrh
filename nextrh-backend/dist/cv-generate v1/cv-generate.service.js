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
const axios_1 = __importDefault(require("axios"));
const cv_service_1 = require("../cvs/cv.service");
let CvGenerateService = class CvGenerateService {
    constructor(cvService) {
        this.cvService = cvService;
    }
    async processSmartTemplate(cvId, file) {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const extension = path.extname(file.originalname).toLowerCase();
        const timestamp = Date.now();
        const tempDocxPath = path.join(uploadDir, `temp_${timestamp}.docx`);
        let workingDocxPath = tempDocxPath;
        try {
            if (extension === '.pdf') {
                const tempPdfPath = path.join(uploadDir, `input_${timestamp}.pdf`);
                fs.writeFileSync(tempPdfPath, file.buffer);
                console.log('Conversion PDF vers DOCX en cours...');
                await this.convertPdfToDocx(tempPdfPath, tempDocxPath);
                if (fs.existsSync(tempPdfPath))
                    fs.unlinkSync(tempPdfPath);
            }
            else {
                fs.writeFileSync(tempDocxPath, file.buffer);
            }
            const extraction = await mammoth.extractRawText({ path: tempDocxPath });
            const templateText = extraction.value;
            const realData = await this.cvService.getFullCvData(cvId);
            const mapping = await this.getSmartMappingFromOllama(templateText, realData);
            const finalDocxPath = path.join(uploadDir, `final_${timestamp}.docx`);
            fs.copyFileSync(tempDocxPath, finalDocxPath);
            await this.injectDataWithPython(finalDocxPath, mapping);
            const finalBuffer = fs.readFileSync(finalDocxPath);
            if (fs.existsSync(tempDocxPath))
                fs.unlinkSync(tempDocxPath);
            if (fs.existsSync(finalDocxPath))
                fs.unlinkSync(finalDocxPath);
            return finalBuffer;
        }
        catch (error) {
            console.error('Erreur lors du traitement du template:', error);
            throw new common_1.InternalServerErrorException(`Erreur de génération : ${error.message}`);
        }
    }
    async getSmartMappingFromOllama(templateText, realData) {
        const dataBlocks = {
            identity_block: `${realData.full_name}\n${realData.profession}`,
            contact_block: `Email: ${realData.email}\nTél: ${realData.phone}\nFax: ${realData.fax || ''}\nAdresse: ${realData.address}`,
            skills_block: realData.skills.join(' • '),
            certifications_block: realData.certifications.map(c => `• ${c.cert_name} (${c.provider})`).join('\n'),
            education_block: realData.education.map(e => `• ${e.end_year || ''}: ${e.degree} - ${e.institution}`).join('\n'),
            experiences_block: realData.experiences.map(ex => {
                const year = ex.start_date ? new Date(ex.start_date).getFullYear() : '';
                return `• ${year}: ${ex.role} chez ${ex.company}\n  ${ex.description}`;
            }).join('\n')
        };
        const prompt = `
    Tu es un Expert en Architecture Documentaire. Tu dois remplacer le contenu d'un CV Template par mes DONNÉES RÉELLES.
    
    TEXTE DU TEMPLATE : 
    "${templateText}"

    DONNÉES RÉELLES (Source de Vérité) :
    ${JSON.stringify(dataBlocks)}

    MISSION :
    Génère un JSON PLAT de type { "Texte à supprimer" : "Texte à injecter" }.

    RÈGLES DE REMPLACEMENT :
    1. SOUVERAINETÉ : Toutes mes "DONNÉES RÉELLES" doivent apparaître. Si le template n'a pas de place pour le "Fax", ajoute-le dans le "contact_block".
    2. NETTOYAGE : Si une section du template n'existe pas dans mes données (ex: "LANGUES", "CENTRES D’INTÉRÊT" ou pubs "AZURIUS"), remplace-la par "".
    3. ANCRAGE : Identifie la ligne d'exemple dans le template (ex: "Forename SURNAME") et remplace-la par le bloc correspondant (ex: "identity_block").
    4. REFLOW : Utilise "\\n" dans les valeurs pour que le script Python crée de nouvelles lignes.

    RETOURNE UNIQUEMENT LE JSON PLAT.
  `;
        const response = await axios_1.default.post('http://localhost:11434/api/generate', {
            model: 'qwen2.5:7b',
            prompt: prompt,
            stream: false,
            format: 'json',
        });
        const mapping = JSON.parse(response.data.response);
        console.log('--- MAPPING SÉMANTIQUE ---', mapping);
        return mapping;
    }
    convertPdfToDocx(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(process.cwd(), 'src', 'cv-generate', 'convertpdf.py');
            const pythonPath = 'C:\\Users\\sedki\\Desktop\\NextRH\\nextrh-backend\\python-env\\Scripts\\python.exe';
            const pyProcess = (0, child_process_1.spawn)(pythonPath, [scriptPath, inputPath, outputPath]);
            pyProcess.on('close', (code) => {
                if (code === 0)
                    resolve();
                else
                    reject(new Error(`La conversion Python a échoué (code ${code})`));
            });
        });
    }
    async injectDataWithPython(docxPath, mapping) {
        const mappingPath = path.join(process.cwd(), 'uploads', `map_${Date.now()}.json`);
        fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), 'utf-8');
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(process.cwd(), 'src', 'cv-generate', 'smart_replace.py');
            const pythonPath = 'C:\\Users\\sedki\\Desktop\\NextRH\\nextrh-backend\\python-env\\Scripts\\python.exe';
            const pyProcess = (0, child_process_1.spawn)(pythonPath, [scriptPath, docxPath, mappingPath]);
            pyProcess.on('close', (code) => {
                if (fs.existsSync(mappingPath))
                    fs.unlinkSync(mappingPath);
                if (code === 0)
                    resolve();
                else
                    reject(new Error(`L'injection Python a échoué (code ${code})`));
            });
            pyProcess.stderr.on('data', (data) => {
                console.error('PYTHON ERROR:', data.toString());
            });
        });
    }
};
exports.CvGenerateService = CvGenerateService;
exports.CvGenerateService = CvGenerateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_service_1.CvService])
], CvGenerateService);
//# sourceMappingURL=cv-generate.service.js.map