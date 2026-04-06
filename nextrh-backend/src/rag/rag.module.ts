import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';
import { EmbeddingService } from './embedding.service';
import { VectorService } from './vector.service';
import { CvService } from './cv.service';

@Module({
  providers: [RagService, EmbeddingService, VectorService, CvService],
  controllers: [RagController],
})
export class RagModule {}