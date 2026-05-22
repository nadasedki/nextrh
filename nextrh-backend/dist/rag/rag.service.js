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
const evaluation_service_1 = require("../modules/evaluation/evaluation.service");
let RagService = class RagService {
    constructor(cvService, embeddingService, vectorService, evaluationService) {
        this.cvService = cvService;
        this.embeddingService = embeddingService;
        this.vectorService = vectorService;
        this.evaluationService = evaluationService;
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
        const profiles = await this.cvService.getAllUnifiedProfiles();
        console.log(`Début de l'indexation atomique de ${profiles.length} profils candidats...`);
        let totalChunks = 0;
        for (const profile of profiles) {
            const chunksToEmbed = [];
            chunksToEmbed.push({
                text: `CANDIDAT: ${profile.full_name} | PROFESSION: ${profile.profession || 'N/A'} | DÉPARTEMENT: ${profile.department || 'N/A'} | EXPÉRIENCE GLOBALE: ${profile.years_of_experience} ans `,
                type: 'profile'
            });
            if (profile.certifications) {
                for (const cert of profile.certifications) {
                    const statusStr = cert.status ? ` (Statut: ${cert.status})` : '';
                    chunksToEmbed.push({
                        text: `CANDIDAT: ${profile.full_name} | CERTIFICATION: ${cert.cert_name} par ${cert.provider || 'Inconnu'}${statusStr}`,
                        type: 'certification'
                    });
                }
            }
            if (profile.education) {
                for (const edu of profile.education) {
                    const dateStr = (edu.start_year && edu.end_year) ? ` de ${edu.start_year} à ${edu.end_year}` : '';
                    chunksToEmbed.push({
                        text: `CANDIDAT: ${profile.full_name} | DIPLÔME: ${edu.degree} en ${edu.field_of_study || 'Général'} à l'établissement ${edu.institution || 'Inconnu'}${dateStr}`,
                        type: 'education'
                    });
                }
            }
            if (profile.projects) {
                for (const proj of profile.projects) {
                    const techStr = (proj.technologies && proj.technologies.length > 0) ? ` | TECHNOLOGIES UTILISÉES: ${proj.technologies.join(', ')}` : '';
                    chunksToEmbed.push({
                        text: `CANDIDAT: ${profile.full_name} | PROJET: ${proj.name} (Rôle: ${proj.role || 'Participant'}${proj.client ? ` pour ${proj.client}` : ''}). Description: ${proj.description || ''}${techStr}`,
                        type: 'project'
                    });
                }
            }
            if (profile.experiences) {
                for (const exp of profile.experiences) {
                    chunksToEmbed.push({
                        text: `CANDIDAT: ${profile.full_name} | EXPÉRIENCE: Poste de ${exp.role} chez ${exp.company}. Missions et Activités: ${exp.description || ''}`,
                        type: 'experience'
                    });
                }
            }
            for (const item of chunksToEmbed) {
                const vector = await this.embeddingService.embed(item.text);
                if (vector.length > 0) {
                    await this.vectorService.insertVector(vector, {
                        cv_id: profile.cv_id,
                        user_id: profile.user_id,
                        full_name: profile.full_name,
                        text: item.text,
                        type: item.type
                    });
                    totalChunks++;
                }
            }
            console.log(`✓ Candidat ${profile.full_name}: ${chunksToEmbed.length} vecteurs insérés.`);
        }
        return totalChunks;
    }
    async ask(question) {
        const candidates = await this.cvService.getAllNames();
        const questionLower = question.toLowerCase();
        const targetCandidate = candidates.find(name => {
            const parts = name.toLowerCase().split(' ');
            return questionLower.includes(name.toLowerCase()) || parts.some(part => part.length > 2 && questionLower.includes(part));
        });
        let targetType = undefined;
        if (questionLower.includes('certif') || questionLower.includes('attestation') || questionLower.includes('crédential')) {
            targetType = 'certification';
        }
        else if (questionLower.includes('expérien') || questionLower.includes('poste') || questionLower.includes('travail') || questionLower.includes('chez') || questionLower.includes('employ')) {
            targetType = 'experience';
        }
        else if (questionLower.includes('étud') || questionLower.includes('école') || questionLower.includes('universit') || questionLower.includes('diplôm')) {
            targetType = 'education';
        }
        else if (questionLower.includes('projet')) {
            targetType = 'project';
        }
        const queryVector = await this.embeddingService.embed(question);
        const rawResults = await this.vectorService.search(queryVector, targetCandidate, 6);
        let results = rawResults;
        if (!results || results.length === 0) {
            return "No relevant information found in candidates profiles database.";
        }
        const scored = results.map(r => {
            const text = r.payload.text.toLowerCase();
            const payloadType = r.payload.type;
            let score = 0;
            const keywords = questionLower.split(" ");
            for (const k of keywords) {
                if (k.length > 2 && text.includes(k))
                    score += 1.5;
            }
            if (targetType && payloadType === targetType) {
                score += 8.0;
            }
            if (targetCandidate && text.includes(targetCandidate.toLowerCase())) {
                score += 10.0;
            }
            return { ...r, score };
        });
        const topResults = scored
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        const contextPrompt = topResults
            .map((c, i) => `[FACT ${i + 1}] (Section Relatée: ${c.payload.type?.toUpperCase()})\n${c.payload.text}`)
            .join('\n\n');
        const prompt = `You are a precise HR assistant.
RULES:
- Answer the user query using ONLY the verified facts below.
- If the facts do not contain the answer, explicitly state "Not found in CVs".
- Do not guess or extrapolate.

VERIFIED FACTS:
${contextPrompt}

QUESTION:
${question}

ANSWER:`;
        try {
            const response = await axios_1.default.post('http://localhost:11434/api/chat', {
                model: 'qwen2.5:7b',
                messages: [{ role: 'user', content: prompt }],
                stream: false,
                options: { temperature: 0.0 },
            });
            const answer = response.data.message?.content || "Error generating response";
            this.evaluationService.log({
                id: Date.now().toString(),
                question,
                contexts: topResults.map(r => r.payload.text),
                answer,
                ground_truth: null,
                metadata: { model: 'qwen2.5:7b', databaseSchema: 'v16.4_aligned' },
            });
            return answer;
        }
        catch (error) {
            return `LLM error: ${error.message}`;
        }
    }
};
exports.RagService = RagService;
exports.RagService = RagService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_service_1.CvService,
        embedding_service_1.EmbeddingService,
        vector_service_1.VectorService,
        evaluation_service_1.EvaluationService])
], RagService);
//# sourceMappingURL=rag.service.js.map