import { Injectable } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import * as fs from 'fs';

@Injectable()
export class OcrService {

  async extractTextFromImage(imagePath: string): Promise<string> {
    const { data } = await Tesseract.recognize(
      imagePath,
      'eng',
      {
        logger: m => console.log(m)
      }
    );

    return data.text;
  }

  async extractTextFromPdf(pdfPath: string): Promise<string> {
    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF file not found');
    }

    // ⚠️ ici version simple : si PDF texte natif
    const pdf = require('pdf-parse');
    const buffer = fs.readFileSync(pdfPath);
    const data = await pdf(buffer);

    return data.text;
  }
}