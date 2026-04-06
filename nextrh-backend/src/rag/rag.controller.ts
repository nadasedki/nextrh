import { Controller, Post, Body, Delete } from '@nestjs/common';
import { RagService } from './rag.service';
import { VectorService } from './vector.service';

@Controller('rag')
export class RagController {
  constructor(
    private ragService: RagService,
    private vectorService: VectorService
  ) {}

  @Post('ask')
  async ask(@Body('question') question: string) {
    const answer = await this.ragService.ask(question);
    return { answer };
  }

  @Post('index')
  async index() {
    // delete avant de ré-indexer pour éviter les doublons
    await this.vectorService.deleteCollection();
    await this.ragService.ensureCollectionExists();
    
    const chunkCount = await this.ragService.indexAllCVs();
    return { status: 'success', chunksIndexed: chunkCount };
  }
}