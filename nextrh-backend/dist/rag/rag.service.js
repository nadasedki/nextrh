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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const embedding_service_1 = require("./embedding.service");
const vector_service_1 = require("./vector.service");
const cv_service_1 = require("./cv.service");
let RagService = class RagService {
    constructor(cvService, embeddingService, vectorService) {
        this.cvService = cvService;
        this.embeddingService = embeddingService;
        this.vectorService = vectorService;
    }
    async onModuleInit() {
        await this.ensureCollectionExists();
    }
    async ensureCollectionExists() {
        const client = await this.vectorService.getClient();
        try {
            const collections = await client.getCollections();
            if (!collections.collections.some(c => c.name === this.vectorService.collectionName)) {
                await client.createCollection(this.vectorService.collectionName, {
                    vectors: { size: 768, distance: 'Cosine' },
                });
            }
        }
        catch (err) {
            console.error("Qdrant Init Error:", err.message);
        }
    }
    async indexAllCVs() {
        const cvs = await this.cvService.getAllCVs();
        console.log(`🚀 Début de l'indexation enrichie de ${cvs.length} CVs...`);
        let totalChunks = 0;
        for (const cv of cvs) {
            if (!cv.fullText)
                continue;
            const chunks = this.cvService.chunkText(cv.fullText, 1000);
            for (const chunk of chunks) {
                const enrichedText = `CANDIDAT: ${cv.full_name} | CONTENU: ${chunk}`;
                const vector = await this.embeddingService.embed(enrichedText);
                if (vector.length > 0) {
                    await this.vectorService.insertVector(vector, {
                        cv_id: cv.cv_id,
                        full_name: cv.full_name,
                        text: enrichedText,
                    });
                    totalChunks++;
                }
            }
            console.log(`✅ CV #${cv.cv_id} (${cv.full_name}) : ${chunks.length} chunks indexés.`);
        }
        return totalChunks;
    }
    async ask(question) {
        const candidates = await this.cvService.getAllNames();
        const questionLower = question.toLowerCase();
        const targetCandidate = candidates.find(name => {
            const parts = name.toLowerCase().split(' ');
            const firstName = parts[0];
            const lastName = parts[parts.length - 1];
            return questionLower.includes(name.toLowerCase()) ||
                questionLower.includes(firstName) ||
                questionLower.includes(lastName);
        });
        if (targetCandidate) {
            console.log(`🎯 Filtre Metadata appliqué pour : ${targetCandidate}`);
        }
        const queryVector = await this.embeddingService.embed(question);
        const results = await this.vectorService.search(queryVector, targetCandidate, 7);
        const context = results
            .map(r => `[EXTRAIT DU CV DE ${r.payload.full_name}]\n${r.payload.text}`)
            .join('\n\n---\n\n');
        if (!context)
            return "Je n'ai trouvé aucune information pertinente dans les CV pour répondre à cette question.";
        console.log("--- DEBUG CONTEXTE ENVOYÉ AU LLM ---");
        console.log(context);
        console.log("-------------------------------------");
        const prompt = `
### RÔLE
Tu es un Expert en Recrutement RH. Ta mission est d'extraire des réponses précises à partir des extraits de CV fournis.

### CONTEXTE DES CV (Source de vérité)
${context}

### QUESTION DE L'UTILISATEUR
${question}

### RÈGLES DE RÉPONSE
1. Utilise EXCLUSIVEMENT les informations du contexte ci-dessus.
2. Si tu parles d'une personne, cite obligatoirement son NOM COMPLET.
3. Si l'information n'est pas dans le contexte, dis simplement que tu ne sais pas.
4. Réponds de manière structurée (puces si nécessaire).

RÉPONSE :
`;
        try {
            const response = await axios_1.default.post('http://localhost:11434/api/chat', {
                model: 'qwen2.5:7b',
                messages: [{ role: 'user', content: prompt }],
                stream: false,
                options: {
                    temperature: 0.1,
                }
            });
            return response.data.message?.content || 'Erreur lors de la génération de la réponse.';
        }
        catch (error) {
            return `Erreur de communication avec le moteur IA : ${error.message}`;
        }
    }
};
exports.RagService = RagService;
exports.RagService = RagService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_service_1.CvService,
        embedding_service_1.EmbeddingService,
        vector_service_1.VectorService])
], RagService);
//# sourceMappingURL=rag.service.js.map