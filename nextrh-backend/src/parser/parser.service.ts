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

 
async extractTextFromImage(imagePath: string): Promise<{ text: string; confidence: number }> {
    const result = await tesseract.recognize(imagePath, 'eng+fra');
    return {
      text: result.data.text,
      confidence: result.data.confidence // Récupération de la confiance interne de Tesseract
    };
  }

  /**
   * MODIFIÉ : Calcule la moyenne de confiance sur toutes les pages rasterisées du PDF
   */
  async extractTextFromPdf(pdfPath: string): Promise<{ text: string; confidence: number }> {
    const pages = await this.pdfToImages(pdfPath);
    console.log('Generated pages:', pages);
    
    let fullText = '';
    let totalConfidence = 0;

    for (const page of pages) {
      // Extraction du texte et de la confiance pour la page courante
      const { text, confidence } = await this.extractTextFromImage(page);
      fullText += text + '\n';
      totalConfidence += confidence;
    }

    // Calcul de la moyenne arithmétique de la confiance de l'OCR
    const averageConfidence = pages.length > 0 ? parseFloat((totalConfidence / pages.length).toFixed(2)) : 0;

    console.log(' AVERAGE OCR CONFIDENCE:', averageConfidence);

    const cleanedText = this.cleanText(fullText);
    console.log('FINAL OCR TEXT:', cleanedText);

    return {
      text: cleanedText,
      confidence: averageConfidence // Transmission de la confiance moyenne calculée
    };
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
public formatDateToISO(dateStr: string | null | undefined): string | null {
    if (!dateStr || String(dateStr).trim().toLowerCase() === 'null' || dateStr.trim() === '') return null;

    let cleanedStr = dateStr
      .trim()
      .replace(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)[,\s]+/i, '')
      .replace(/janvier/i, 'January').replace(/fevrier/i, 'February').replace(/mars/i, 'March')
      .replace(/avril/i, 'April').replace(/mai/i, 'May').replace(/juin/i, 'June')
      .replace(/juillet/i, 'July').replace(/aout/i, 'August').replace(/septembre/i, 'September')
      .replace(/octobre/i, 'October').replace(/novembre/i, 'November').replace(/decembre/i, 'December');

    const timestamp = Date.parse(cleanedStr);
    if (isNaN(timestamp)) return dateStr; // En cas d'échec, on laisse la string brute pour le fallback

    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}
/* async extractTextFromImage(imagePath: string): Promise<string> {
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
  }*/