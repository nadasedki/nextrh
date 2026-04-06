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

  /**
   * INDEXATION AVEC INJECTION DE CONTEXTE (SOTA)
   */
  async indexAllCVs(): Promise<number> {
    const cvs = await this.cvService.getAllCVs();
    console.log(`🚀 Début de l'indexation enrichie de ${cvs.length} CVs...`);
    
    let totalChunks = 0;
    for (const cv of cvs) {
      if (!cv.fullText) continue;
      
      // Découpage en morceaux (taille 1000 pour garder de la substance)
      const chunks = this.cvService.chunkText(cv.fullText, 1000); 

      for (const chunk of chunks) {
        // --- ÉTAPE CRITIQUE : CONTEXT INJECTION ---
        // On injecte le nom du candidat DIRECTEMENT dans le texte avant l'embedding.
        // Cela permet au vecteur de "connaître" l'identité à laquelle il appartient.
        const enrichedText = `CANDIDAT: ${cv.full_name} | CONTENU: ${chunk}`;

        const vector = await this.embeddingService.embed(enrichedText);
        
        if (vector.length > 0) {
          await this.vectorService.insertVector(vector, {
            cv_id: cv.cv_id,
            full_name: cv.full_name, 
            text: enrichedText, // On stocke la version enrichie pour le LLM
          });
          totalChunks++;
        }
      }
      console.log(`✅ CV #${cv.cv_id} (${cv.full_name}) : ${chunks.length} chunks indexés.`);
    }
    return totalChunks;
  }

  /**
   * RECHERCHE AVEC FILTRAGE DYNAMIQUE PAR MÉTADONNÉES
   */
  async ask(question: string): Promise<string> {
    // 1. Récupération dynamique des noms pour le filtrage
    const candidates = await this.cvService.getAllNames();
    
    // 2. Détection du candidat dans la question
    const questionLower = question.toLowerCase();
    const targetCandidate = candidates.find(name => {
      const parts = name.toLowerCase().split(' ');
      const firstName = parts[0];
      const lastName = parts[parts.length - 1];
      // On cherche si le nom complet, le prénom ou le nom de famille est cité
      return questionLower.includes(name.toLowerCase()) || 
             questionLower.includes(firstName) || 
             questionLower.includes(lastName);
    });

    if (targetCandidate) {
      console.log(`🎯 Filtre Metadata appliqué pour : ${targetCandidate}`);
    }

    // 3. Embedding de la question
    const queryVector = await this.embeddingService.embed(question);
    
    // 4. Recherche Qdrant (Filtre + Similitude)
    // On récupère le Top-7 pour avoir assez de contexte
    const results = await this.vectorService.search(queryVector, targetCandidate, 7);

    // 5. Construction du contexte pour le LLM
    const context = results
      .map(r => `[EXTRAIT DU CV DE ${r.payload.full_name}]\n${r.payload.text}`)
      .join('\n\n---\n\n');

    if (!context) return "Je n'ai trouvé aucune information pertinente dans les CV pour répondre à cette question.";

    // --- DEBUG ---
    console.log("--- DEBUG CONTEXTE ENVOYÉ AU LLM ---");
    console.log(context); 
    console.log("-------------------------------------");

    // 6. Génération de la réponse via Ollama
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
      const response = await axios.post('http://localhost:11434/api/chat', {
        model: 'qwen2.5:7b',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: {
          temperature: 0.1, // Basse température pour éviter les inventions
        }
      });

      return response.data.message?.content || 'Erreur lors de la génération de la réponse.';
    } catch (error) {
      return `Erreur de communication avec le moteur IA : ${error.message}`;
    }
  }
}