import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
// @ts-ignore
import pdfjs = require('pdfjs-dist/legacy/build/pdf');

@Injectable()
export class PdfExtractorService {
  async extractTextFromPdf(pdfPath: string): Promise<string> {
    try {
      const data = new Uint8Array(fs.readFileSync(pdfPath));
      const loadingTask = pdfjs.getDocument({ data, useSystemFonts: true, disableFontFace: true });
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      }
      return fullText;
    } catch (error) {
      throw new InternalServerErrorException('Erreur lecture PDF');
    }
  }

   async extractRawText(pdfPath: string): Promise<string> {
      if (!fs.existsSync(pdfPath)) throw new NotFoundException('Fichier PDF introuvable');
      try {
        const data = new Uint8Array(fs.readFileSync(pdfPath));
        const loadingTask = pdfjs.getDocument({ data, useSystemFonts: true, disableFontFace: true });
        const pdf = await loadingTask.promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        console.log("RAW  OUTPUT:", fullText);
        return fullText;
      } catch (error) {
        throw new InternalServerErrorException('Erreur lecture PDF');
      }
    }
}