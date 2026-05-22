import { Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { EmbeddingService } from './embedding.service';
import { VectorService } from './vector.service';
import { CvService } from './cv.service';
import { EvaluationService } from '../modules/evaluation/evaluation.service'; 

type QdrantPayload = {
  text?: string;
  full_name?: string;
  cv_id?: number;
  user_id?: number;
  type?: 'profile' | 'certification' | 'education' | 'project' | 'experience';
};

type SearchResult = {
  payload?: QdrantPayload;
  score?: number;
};

@Injectable()
export class RagService implements OnModuleInit {
  constructor(
    private cvService: CvService,
    private embeddingService: EmbeddingService,
    private vectorService: VectorService,
    private evaluationService: EvaluationService,
  ) {}

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
    } catch (err) { console.error("Qdrant Init Error:", err.message); }
  }

  /**
   * ATOMIC INDEXATION PIPELINE (SQL Rows -> Atomic Vectors)
   */
  async indexAllCVs(): Promise<number> {
    const profiles = await this.cvService.getAllUnifiedProfiles();
    console.log(`Début de l'indexation atomique de ${profiles.length} profils candidats...`);
    
    let totalChunks = 0;

    for (const profile of profiles) {
      const chunksToEmbed: { text: string; type: QdrantPayload['type'] }[] = [];

      // 1. Core Profile Base Fact
      chunksToEmbed.push({
        text: `CANDIDAT: ${profile.full_name} | PROFESSION: ${profile.profession || 'N/A'} | DÉPARTEMENT: ${profile.department || 'N/A'} | EXPÉRIENCE GLOBALE: ${profile.years_of_experience} ans `,
        type: 'profile'
      });

      // 2. Certifications Extraction Loop
      if (profile.certifications) {
        for (const cert of profile.certifications) {
          const statusStr = cert.status ? ` (Statut: ${cert.status})` : '';
          chunksToEmbed.push({
            text: `CANDIDAT: ${profile.full_name} | CERTIFICATION: ${cert.cert_name} par ${cert.provider || 'Inconnu'}${statusStr}`,
            type: 'certification'
          });
        }
      }

      // 3. Education Extraction Loop
      if (profile.education) {
        for (const edu of profile.education) {
          const dateStr = (edu.start_year && edu.end_year) ? ` de ${edu.start_year} à ${edu.end_year}` : '';
          chunksToEmbed.push({
            text: `CANDIDAT: ${profile.full_name} | DIPLÔME: ${edu.degree} en ${edu.field_of_study || 'Général'} à l'établissement ${edu.institution || 'Inconnu'}${dateStr}`,
            type: 'education'
          });
        }
      }

      // 4. Projects Extraction Loop (Handles PostgreSQL string arrays)
      if (profile.projects) {
        for (const proj of profile.projects) {
          const techStr = (proj.technologies && proj.technologies.length > 0) ? ` | TECHNOLOGIES UTILISÉES: ${proj.technologies.join(', ')}` : '';
          chunksToEmbed.push({
            text: `CANDIDAT: ${profile.full_name} | PROJET: ${proj.name} (Rôle: ${proj.role || 'Participant'}${proj.client ? ` pour ${proj.client}` : ''}). Description: ${proj.description || ''}${techStr}`,
            type: 'project'
          });
        }
      }

      // 5. Experiences Extraction Loop
      if (profile.experiences) {
        for (const exp of profile.experiences) {
          chunksToEmbed.push({
            text: `CANDIDAT: ${profile.full_name} | EXPÉRIENCE: Poste de ${exp.role} chez ${exp.company}. Missions et Activités: ${exp.description || ''}`,
            type: 'experience'
          });
        }
      }

      // Vector Injection Sequence
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

  /**
   * SEMANTIC QUERY ASSISTANT WITH ARCHITECTURAL ENTITY ROUTING
   */
  async ask(question: string): Promise<string> {
    const candidates = await this.cvService.getAllNames();
    const questionLower = question.toLowerCase();

    // Check if a candidate's name is mentioned in the question
    const targetCandidate = candidates.find(name => {
      const parts = name.toLowerCase().split(' ');
      return questionLower.includes(name.toLowerCase()) || parts.some(part => part.length > 2 && questionLower.includes(part));
    });

    // Semantic keyword classification routing
    let targetType: QdrantPayload['type'] = undefined;
    if (questionLower.includes('certif') || questionLower.includes('attestation') || questionLower.includes('crédential')) {
      targetType = 'certification';
    } else if (questionLower.includes('expérien') || questionLower.includes('poste') || questionLower.includes('travail') || questionLower.includes('chez') || questionLower.includes('employ')) {
      targetType = 'experience';
    } else if (questionLower.includes('étud') || questionLower.includes('école') || questionLower.includes('universit') || questionLower.includes('diplôm')) {
      targetType = 'education';
    } else if (questionLower.includes('projet')) {
      targetType = 'project';
    }

    const queryVector = await this.embeddingService.embed(question);

    // Pull down top 6 close-match vectors for granular evaluation
    const rawResults = await this.vectorService.search(queryVector, targetCandidate, 6);
    let results: SearchResult[] = rawResults as any[];

    if (!results || results.length === 0) {
      return "No relevant information found in candidates profiles database.";
    }

    // Dense Metadata Reranking Score Adjustments
    const scored = results.map(r => {
      const text = (r.payload.text as string).toLowerCase();
      const payloadType = r.payload.type;
      let score = 0;

      // Extract raw overlap metrics
      const keywords = questionLower.split(" ");
      for (const k of keywords) {
        if (k.length > 2 && text.includes(k)) score += 1.5;
      }

      // Context routing boost
      if (targetType && payloadType === targetType) {
        score += 8.0; 
      }

      // Candidate tracking boost
      if (targetCandidate && text.includes(targetCandidate.toLowerCase())) {
        score += 10.0;
      }

      return { ...r, score };
    });

    // Retain only top 3 pristine records
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
      const response = await axios.post('http://localhost:11434/api/chat', {
        model: 'qwen2.5:7b',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: { temperature: 0.0 }, // Enforce consistency
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
    } catch (error) {
      return `LLM error: ${error.message}`;
    }
  }
}