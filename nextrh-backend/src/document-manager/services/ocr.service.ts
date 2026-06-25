import { Injectable, Logger } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import * as pdfImgConvert from 'pdf-img-convert';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  /**
   * Processes a scanned PDF buffer by converting pages into images, 
   * running multi-page OCR locally, and returning the aggregated text.
   */
  async extractTextFromPdf(pdfBuffer: Buffer, language: string = 'fra+eng'): Promise<string> {
    this.logger.log('📄 Scanned PDF received. Initiating PDF-to-Image rasterization...');

    try {
      // 1. Convert all PDF pages to high-resolution PNG buffers (100% locally in JS)
      const pageImages = await pdfImgConvert.convert(pdfBuffer, {
        width: 1200, // Forces high-DPI resolution per page to ensure high OCR accuracy
      });

      this.logger.log(`📄 Rasterization complete. Found ${pageImages.length} pages. Starting sequential OCR...`);

      let aggregatedText = '';

      // 2. Loop through each page image buffer and extract text
      for (let i = 0; i < pageImages.length; i++) {
        this.logger.log(`🔍 Processing OCR on page ${i + 1}/${pageImages.length}...`);
        
        const result = await Tesseract.recognize(pageImages[i] as Buffer, language);
        
        aggregatedText += `\n--- Page ${i + 1} ---\n${result.data.text}`;
      }

      return aggregatedText;
    } catch (error) {
      this.logger.error(`Scanned PDF OCR processing failed: ${error.message}`);
      throw new Error(`Échec de l'extraction OCR sur le PDF : ${error.message}`);
    }
  }
}