import { Injectable } from '@nestjs/common';

@Injectable()
export class ChunkingService {
  chunk(text: string, size = 500): string[] {
    const chunks = [];
    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.slice(i, i + size));
    }
    return chunks;
  }
}