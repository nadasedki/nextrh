import { Injectable, Logger } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);
  private readonly model;
  private readonly MAX_SINGLE_PASS_LENGTH = 12000; 

constructor() {}
 async extractRawText(fileBuffer: Buffer): Promise<string> {
    this.logger.log('📄 Extracting raw PDF text string...');
    const parser = new PDFParse({ data: fileBuffer });
    try {
      const result = await parser.getText();
      const rawText = result.text;
      this.logger.log(`RAW TEXT:\n${rawText}`);
      return rawText;
    } finally {
      await parser.destroy();
    }
  }
}