import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class EmbeddingService {
  // Utilisation de 127.0.0.1 pour la stabilité
  private readonly ollamaUrl = 'http://127.0.0.1:11434/api/embeddings';

  async embed(text: string): Promise<number[]> {
    try {
      // Nettoyage du texte pour éviter les caractères spéciaux qui font crasher l'IA
      const cleanText = text.replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim();
      
      // Troncature de sécurité (Nomic a une limite de jetons)
      // On limite à ~3000 caractères pour être sûr que ça passe toujours
      const safeText = cleanText.length > 3000 ? cleanText.substring(0, 3000) : cleanText;

      const res = await axios.post(this.ollamaUrl, {
        model: 'nomic-embed-text',
        prompt: safeText,
      }, { timeout: 30000 });

      return res.data.embedding || [];
    } catch (err) {
      // Affiche une erreur plus claire
      const errorMsg = err.response?.data?.error || err.message;
      console.error(`Erreur Embedding Ollama: ${errorMsg}`);
      return [];
    }
  }
}