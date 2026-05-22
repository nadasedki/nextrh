import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CvService } from '../cvs/cv.service';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

@Injectable()
export class CvGeneratorService {
  constructor(private readonly cvService: CvService) {
    // --- ENREGISTREMENT DES HELPERS HANDLEBARS ---
    
    // Helper pour formater les dates : {{formatDate ma_date}}
    // Sortie exemple : "Février 2020"
    if (!handlebars.helpers.formatDate) {
      handlebars.registerHelper('formatDate', (date) => {
        if (!date) return '';
        try {
          const d = new Date(date);
          // Vérification si la date est valide
          if (isNaN(d.getTime())) return date; 
          return format(d, 'MMMM yyyy', { locale: fr });
        } catch (e) {
          return date;
        }
      });
    }

    // Helper pour les listes de compétences ou autres
    if (!handlebars.helpers.join) {
      handlebars.registerHelper('join', (array, sep) => {
        if (!Array.isArray(array)) return '';
        return array.join(sep || ', ');
      });
    }
  }

  async generateSmartPdf(cvId: number, templateHtml: string): Promise<Buffer> {
    try {
      // 1. Récupération des données complètes (User + Certifs + Exp + Edu + Projets)
      const data = await this.cvService.getFullCvData(cvId);

      // 2. Compilation du template avec Handlebars
      const template = handlebars.compile(templateHtml);
      const htmlWithData = template(data);

      // 3. Lancement de Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Important pour les environnements Docker
        ],
      });

      const page = await browser.newPage();

      // On définit le contenu HTML
      // "networkidle0" attend qu'il n'y ait plus de téléchargement (utile pour charger Tailwind via CDN)
      await page.setContent(htmlWithData, { waitUntil: 'networkidle0', timeout: 60000 });

      // 4. Génération du PDF au format A4
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm',
        },
      });

      await browser.close();

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error.message);
      throw new InternalServerErrorException(
        `Erreur de génération du document : ${error.message}`,
      );
    }
  }
}