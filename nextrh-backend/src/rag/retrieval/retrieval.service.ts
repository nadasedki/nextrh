import { Injectable } from '@nestjs/common';
import { VectorService } from '../vector/vector.service';
import { EmbeddingService } from '../embedding/embedding.service';

@Injectable()
export class RetrievalService {
  constructor(
    private vector: VectorService,
    private embed: EmbeddingService,
  ) {}

  async retrieve(question: string) {
    const qVec = await this.embed.embed(question);
    return this.vector.search(qVec, 20);
  }
}