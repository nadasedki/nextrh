import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as mammoth from 'mammoth';
import * as puppeteer from 'puppeteer';
import axios from 'axios';
import { CvService } from '../cvs/cv.service';

@Injectable()
export class CvGenerateService {
  constructor(private readonly cvService: CvService) {}

  async processSmartPdf(cvId: number, file: Express.Multer.File): Promise<Buffer> {
    try {
      // 1. Extraction rapide du HTML du template (Squelette)
      const { value: templateHtml } = await mammoth.convertToHtml({ buffer: file.buffer });

      // 2. Récupération des données Postgres
      const realData = await this.cvService.getFullCvData(cvId);

      // 3. IA : On demande UNIQUEMENT le mapping (JSON très court = Très rapide)
      const mapping = await this.getMappingFromAI(templateHtml, realData);

      // 4. Substitution ultra-rapide en TypeScript
      let finalHtml = templateHtml;
      for (const [oldText, newText] of Object.entries(mapping)) {
        if (oldText && oldText.length > 2) {
          finalHtml = finalHtml.split(oldText).join(String(newText));
        }
      }

      // 5. Rendu PDF instantané
      return await this.renderPdf(finalHtml);

    } catch (error) {
      console.error('Erreur:', error.message);
      throw new InternalServerErrorException("Échec de la génération rapide.");
    }
  }

  private async getMappingFromAI(templateHtml: string, data: any): Promise<any> {
    const prompt = `
      Tu es un expert en mapping de données. Voici un template de CV :
      "${templateHtml.substring(0, 2000)}"

      Voici les données réelles :
      Nom: ${data.full_name}, Poste: ${data.profession}, Contact: ${data.email}, ${data.phone}.
      Expériences: ${data.experiences.map(e => e.role).join(', ')}.

      MISSION : 
      Identifie les textes d'exemple du template et crée un dictionnaire JSON de remplacement.
      RETOURNE UNIQUEMENT LE JSON PLAT.
      Exemple: {"LUCAS LEBLANC": "ANOUAR ABDALLAH"}
    `;

    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'qwen2.5:1.5b', // UTILISER LE MODÈLE 1.5B POUR LA VITESSE
      prompt: prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0 } // Précision maximale
    });

    return JSON.parse(response.data.response);
  }

  private async renderPdf(content: string): Promise<Buffer> {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // Style de base minimaliste pour le rendu
    const styledHtml = `
      <style>
        body { font-family: sans-serif; line-height: 1.5; color: #333; padding: 40px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px; vertical-align: top; border-bottom: 1px solid #eee; }
        h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; }
      </style>
      ${content}
    `;

    await page.setContent(styledHtml, { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return Buffer.from(pdf);
  }
}