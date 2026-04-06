import { Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { EmbeddingService } from './embedding.service';
import { VectorService } from './vector.service';
import { CvService } from './cv.service';

@Injectable()
export class RagService implements OnModuleInit {
  constructor(
    private cvService: CvService,
    private embeddingService: EmbeddingService,
    private vectorService: VectorService,
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

  async indexAllCVs(): Promise<number> {
    const cvs = await this.cvService.getAllCVs();
    console.log(`Début de l'indexation de ${cvs.length} CVs...`);
    
    let totalChunks = 0;
    for (const cv of cvs) {
      if (!cv.fullText) continue;
      
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


  /*
async ask(question: string): Promise<string> {
  // Liste des noms de ta base (tu peux les récupérer dynamiquement de Postgres)
  const candidates = ["Aya BEN JEMAA", "Anouar ABDALLAH", "Amal KHALFAOUI", "Jazil Gafsi"];
  
  // On cherche si un nom est mentionné dans la question
  const targetCandidate = candidates.find(name => 
    question.toLowerCase().includes(name.toLowerCase().split(' ')[0]) // Cherche au moins le prénom
  );

  const queryVector = await this.embeddingService.embed(question);
  
  // On passe le nom trouvé au service de recherche
  const results = await this.vectorService.search(queryVector, targetCandidate, 7);

  const context = results
    .map(r => `[SOURCE: CV de ${r.payload.full_name}]\n${r.payload.text}`)
    .join('\n\n---\n\n');

  if (!context) return "Je n'ai trouvé aucune information pertinente.";
  //debug


// AJOUTE CE LOG ICI :
console.log("--- DEBUG CONTEXTE ---");
console.log(context); 
console.log("----------------------");
//enddebug
    const prompt = `
Tu es un expert en recrutement RH. Réponds à la question en utilisant UNIQUEMENT le contexte ci-dessous.
Si tu parles d'une personne, cite obligatoirement son nom.

### CONTEXTE DES CV
${context}

### QUESTION
${question}

### RÉPONSE (structurée et claire) :
`;

    const response = await axios.post('http://localhost:11434/api/chat', {
      model: 'qwen2.5:7b',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });

    return response.data.message?.content || 'Erreur LLM';
}*/
// Dans rag.service.ts

async ask(question: string): Promise<string> {
  // 1. RÉCUPÉRATION DYNAMIQUE DEPUIS POSTGRES
  const candidates = await this.cvService.getAllNames();
  
  // 2. LOGIQUE DE DÉTECTION (Identique mais sur liste dynamique)
  const questionLower = question.toLowerCase();
  const targetCandidate = candidates.find(name => {
    const firstName = name.toLowerCase().split(' ')[0];
    // On vérifie si le nom complet ou juste le prénom est dans la question
    return questionLower.includes(name.toLowerCase()) || questionLower.includes(firstName);
  });

  if (targetCandidate) {
    console.log(` Filtre appliqué pour le candidat : ${targetCandidate}`);
  }

  // 3. RECHERCHE VECTORIELLE
  const queryVector = await this.embeddingService.embed(question);
  
  // On passe le candidat trouvé (ou undefined si c'est une question générale)
  const results = await this.vectorService.search(queryVector, targetCandidate, 7);

  // 4. CONSTRUCTION DU CONTEXTE
  const context = results
    .map(r => `[SOURCE: CV de ${r.payload.full_name}]\n${r.payload.text}`)
    .join('\n\n---\n\n');

  if (!context) return "Je n'ai trouvé aucune information pertinente dans les CV.";

  // --- DEBUG ---
  console.log("--- DEBUG CONTEXTE ---");
  console.log(context); 
  console.log("----------------------");

  // 5. GÉNÉRATION DE LA RÉPONSE (Ollama)
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
    const response = await axios.post('http://localhost:11434/api/chat', {
      model: 'qwen2.5:7b',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });

    return response.data.message?.content || 'Erreur LLM';
  } catch (error) {
    return `Erreur lors de la communication avec l'IA : ${error.message}`;
  }
}
}