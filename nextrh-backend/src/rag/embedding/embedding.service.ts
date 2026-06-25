import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class EmbeddingService {
  private url = 'http://127.0.0.1:11434/api/embeddings';

  async embed(text: string): Promise<number[]> {
    const clean = text.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 3000);

    const res = await axios.post(this.url, {
      model: 'nomic-embed-text',
      prompt: clean,
    });

    return res.data.embedding;
  }
}