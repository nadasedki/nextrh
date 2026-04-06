"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var LlmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let LlmService = LlmService_1 = class LlmService {
    constructor() {
        this.logger = new common_1.Logger(LlmService_1.name);
        this.ollamaUrl = 'http://localhost:11434/api/generate';
    }
    async repairSection(sectionKey, rawText) {
        const prompts = {
            contact: `Tu es un extracteur d'identité. 
        Exemple : "Jean Dupont, Ingénieur, 010203" -> {"name": "Jean Dupont", "profession": "Ingénieur", "phone": "010203"}`,
            experience: `Tu es un expert RH. Extrais les expériences professionnelles. 
        Exemple : "Jan 2018 - Present : Dev chez Google" -> [{"company": "Google", "role": "Dev", "period": "Jan 2018 - Present"}]`,
            education: `Tu es un expert académique. Extrais les diplômes. 
        Exemple : "2020 Master Informatique INSAT" -> [{"institution": "INSAT", "degree": "Master", "year": "2020"}]`,
            projects: `Tu es un ingénieur technique. Extrais les projets. 
        Exemple : "2019 STEG : Installation Serveurs" -> [{"client": "STEG", "year": "2019", "description": "Installation Serveurs"}]`,
            certifications: `Tu es un vérificateur de certifications IT. Extrais les noms exacts. 
        Exemple : "Cisco CCNP Security obtenu en 2022" -> [{"cert_name": "CCNP Security", "provider": "Cisco", "year": "2022"}]`,
            skills: `Act as a Professional IT Skill Classifier.
Input: IT Certifications or Job Titles.
Task: Translate each input into 1-2 core technologies or concepts.

STRICT RULES:
- DELETE labels like: "CCNP", "CCNA", "NSE", "SISAS", "Associate", "Professional".
- CONVERT titles to core tech: (e.g., "FortiGate Network Security" -> "Fortinet", "Firewall").
- CONVERT vendor names: (e.g., "Cisco SISAS" -> "Cisco", "ISE").
- DO NOT use phrases. Only 1-2 word tags.

Examples:
"Cisco CCNP Security" -> ["Cisco", "Network Security"]
"FortiGate Network Security – NSE 4" -> ["Fortinet", "FortiGate", "Firewall"]
"Implementing cisco secure access solutions" -> ["Cisco", "Network Access Control"]

RETURN: { "data": ["Tag1", "Tag2", "Tag3"] }`,
        };
        const systemInstruction = prompts[sectionKey] || `Extrais les données de la section ${sectionKey}.`;
        const finalPrompt = `
      ${systemInstruction}
      
      TEXTE À ANALYSER :
      "${rawText}"

      RÈGLES :
      - Réponds UNIQUEMENT avec du JSON.
      - Si rien n'est trouvé, renvoie { "data": [] }.
    `;
        try {
            const response = await axios_1.default.post(this.ollamaUrl, {
                model: 'qwen2.5:7b',
                prompt: finalPrompt,
                stream: false,
                format: 'json',
                options: {
                    temperature: 0.1
                }
            });
            const parsed = JSON.parse(response.data.response);
            let rawData = parsed.data || [];
            if (sectionKey === 'skills') {
                const noiseWords = [
                    "certified", "administrator", "professional", "associate", "specialist",
                    "level", "niveau", "expert", "architect", "engineer",
                    "ccna", "ccnp", "ccda", "ccdp", "nse", "sisas", "implementing", "solutions"
                ];
                const bannedEntities = ["ministère", "banque", "tunisie", "telecom", "next step", "steg", "cnss", "biat", "ooredoo", "voltaire", "affaires"];
                return rawData
                    .map(s => {
                    let cleanS = s.toString().toLowerCase().trim();
                    cleanS = cleanS.replace(/\d+[-/]\d+/g, '');
                    cleanS = cleanS.replace(/\b\d+\b/g, '');
                    cleanS = cleanS.replace(/[.,:()–-]/g, ' ');
                    noiseWords.forEach(word => {
                        const regex = new RegExp(`\\b${word}\\b`, 'gi');
                        cleanS = cleanS.replace(regex, '');
                    });
                    return cleanS.trim();
                })
                    .map(s => s.split(/\s{2,}/))
                    .flat()
                    .filter(s => s.length > 2 && !bannedEntities.some(b => s.includes(b)))
                    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                    .filter((v, i, a) => a.indexOf(v) === i);
            }
        }
        catch (error) {
            this.logger.error(`Erreur LLM section ${sectionKey}: ${error.message}`);
            return [];
        }
    }
};
exports.LlmService = LlmService;
exports.LlmService = LlmService = LlmService_1 = __decorate([
    (0, common_1.Injectable)()
], LlmService);
//# sourceMappingURL=llm.service.js.map