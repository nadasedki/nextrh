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
  //  Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  //  Generate output pattern
  const outputPattern = path.join(outputDir, 'page');

  //  Run pdftoppm
  await execAsync(`pdftoppm -png  "${pdfPath}" "${outputPattern}"`);

  //  Collect generated images
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
    console.log(' OCR TEXT:', fullText);
//  Apply the lightweight cleanup filter here
    const cleanedText = this.cleanText(fullText);
    
    console.log('FINAL OCR TEXT:', cleanedText);
    return cleanedText;
  }
private cleanText(text: string): string {
    if (!text) return '';

    return text
      // 1. Strip out annoying geometric symbols common in bad OCR (¥, \, |, ;, ~, `, _)
      .replace(/[¥\\|;~`_\[\]{}()]/g, '')
      
      // 2. Erase multiple long dashes or underscores used as lines (———)
      .replace(/[—_-]{2,}/g, '')

      // 3. Process line-by-line to fix structural glitches
      .split('\n')
      .map(line => {
        let cleanedLine = line.trim();

        // 4. Strip floating single noise characters at the end of lines (e.g., "Alcatel-Lucent 4" -> "Alcatel-Lucent")
        cleanedLine = cleanedLine.replace(/\s+[a-zA-Z0-9]$/, '');

        // 5. Strip isolated single characters that shouldn't be there (e.g., "a", "J", "/")
        // Keeps common short English words like "on", "to", "at", "by"
        if (cleanedLine.length <= 2 && !/^(at|on|in|by|to|no|ok|is|of)$/i.test(cleanedLine)) {
          return '';
        }

        return cleanedLine;
      })
      // 6. Delete empty lines and compress spacing
      .filter(line => line.length > 0)
      .join('\n');
  }

}
