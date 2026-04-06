import { Injectable } from '@nestjs/common';
import * as tesseract from 'tesseract.js';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import { CreateCertificationDto } from 'src/certifications/dto/create-certification.dto';

const execAsync = promisify(exec);

@Injectable()
export class ParserService {
  
 async pdfToImages(pdfPath: string, outputDir = './tmp'): Promise<string[]> {
  //  Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  //  Generate output pattern
  const outputPattern = path.join(outputDir, 'page');

  //  Run pdftoppm
  await execAsync(`pdftoppm -png "${pdfPath}" "${outputPattern}"`);

  //  Collect generated images
  const files = fs.readdirSync(outputDir)
    .filter(f => f.endsWith('.png'))
    .map(f => path.join(outputDir, f));

  return files;
}

  async extractTextFromImage(imagePath: string): Promise<string> {
    const result = await tesseract.recognize(imagePath, 'eng');
    return result.data.text;
  }

  async extractTextFromPdf(pdfPath: string): Promise<string> {
    const pages = await this.pdfToImages(pdfPath);
    console.log('Generated pages:', pages);
    let fullText = '';
    for (const page of pages) {
      const text = await this.extractTextFromImage(page);
      fullText += text + '\n';
    }
    console.log('FINAL OCR TEXT:', fullText);
    return fullText;
  }

}
