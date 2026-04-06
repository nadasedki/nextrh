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
        console.log(`Début de l'indexation de ${cvs.length} CVs...`);
        let totalChunks = 0;
        for (const cv of cvs) {
            if (!cv.fullText)
                continue;
            const chunks = this.cvService.chunkText(cv.fullText);
            for (const chunk of chunks) {
                const vector = await this.embeddingService.embed(chunk);
                if (vector.length > 0) {
                    await this.vectorService.insertVector(vector, {
                        cv_id: cv.cv_id,
                        full_name: cv.full_name,
                        text: chunk,
                    });
                    totalChunks++;
                }
            }
            console.log(` CV #${cv.cv_id} (${cv.full_name}) indexé.`);
        }
        return totalChunks;
    }
    async ask(question) {
        const candidates = await this.cvService.getAllNames();
        const questionLower = question.toLowerCase();
        const targetCandidate = candidates.find(name => {
            const firstName = name.toLowerCase().split(' ')[0];
            return questionLower.includes(name.toLowerCase()) || questionLower.includes(firstName);
        });
        if (targetCandidate) {
            console.log(` Filtre appliqué pour le candidat : ${targetCandidate}`);
        }
        const queryVector = await this.embeddingService.embed(question);
        const results = await this.vectorService.search(queryVector, targetCandidate, 7);
        const context = results
            .map(r => `[SOURCE: CV de ${r.payload.full_name}]\n${r.payload.text}`)
            .join('\n\n---\n\n');
        if (!context)
            return "Je n'ai trouvé aucune information pertinente dans les CV.";
        console.log("--- DEBUG CONTEXTE ---");
        console.log(context);
        console.log("----------------------");
        const prompt = `
Tu es un expert en recrutement RH. Réponds à la question en utilisant UNIQUEMENT le contexte ci-dessous.
Si tu parles d'une personne, cite obligatoirement son nom complet.

### CONTEXTE DES CV
${context}

### QUESTION
${question}

### RÉPONSE (structurée et claire) :
`;
        try {
            const response = await axios_1.default.post('http://localhost:11434/api/chat', {
                model: 'qwen2.5:7b',
                messages: [{ role: 'user', content: prompt }],
                stream: false,
            });
            return response.data.message?.content || 'Erreur LLM';
        }
        catch (error) {
            return `Erreur lors de la communication avec l'IA : ${error.message}`;
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
//# sourceMappingURL=oldrag.js.map