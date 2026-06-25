import { Module } from '@nestjs/common';
import { DocumentController } from './controllers/document.controller';
import { PdfParserService } from './services/pdf-parser.service';
import { CvHeuristicParserService } from './services/cv-heuristic-parser.service';
import { CvParserFacade } from './services/cv-parser.facade';
import { OcrController } from './controllers/ocr.controller';
import { OcrService } from './services/ocr.service';
import { CvParserFacade2 } from './services/cv-parser.facade2';
import { CvEvaluationService } from './services/cv-evaluation.service';
@Module({
  controllers: [DocumentController,OcrController],
  providers: [PdfParserService, CvHeuristicParserService,CvParserFacade,OcrService,CvParserFacade2, CvEvaluationService],
   exports: [OcrService,CvParserFacade],
})
export class DocumentModule {}
