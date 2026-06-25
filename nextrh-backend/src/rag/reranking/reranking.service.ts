import { Injectable } from '@nestjs/common';

@Injectable()
export class RerankingService {
  rerank(question: string, results: any[]) {
    const q = question.toLowerCase();

    return results
      .map(r => {
        const text = (r.payload?.text || '').toLowerCase();
        let score = r.score || 0;

        const words = q.split(' ');
        for (const w of words) {
          if (text.includes(w)) score += 0.1;
        }

        return { ...r, score };
      })
      .sort((a, b) => b.score - a.score);
  }
}