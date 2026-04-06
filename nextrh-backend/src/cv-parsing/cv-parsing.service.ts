import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';

// @ts-ignore
import pdfjs = require('pdfjs-dist/legacy/build/pdf');
import { PdfExtractorService } from './pdf-extractor/pdf-extractor.service';
import { HeuristicParserService } from './heuristic-parser/heuristic-parser.service';
import { LlmService } from 'src/cv-parsing/llm/llm.service';
import { CvService } from 'src/cvs/cv.service';
import { EducationService } from 'src/education/education.service';
import { CertificationsService } from 'src/certifications/certifications.service';
import { ProjectService } from 'src/project/project.service';
import { ExperienceService } from 'src/experience/experience.service';
@Injectable()
export class CvParsingService {
  private readonly logger = new Logger(CvParsingService.name);
 constructor(
    private pdfExtractor: PdfExtractorService,
    private heuristicParser: HeuristicParserService,
    private llmService: LlmService,
    private cvService: CvService,
    private educationService: EducationService,
    private certificationsService: CertificationsService,
    private projectsService: ProjectService,
     private experienceService: ExperienceService,
  ) {}
  
  async processPdf(pdfPath: string,employeeId: number) {
    const rawText = await this.pdfExtractor.extractRawText(pdfPath);
    console.log("RAW TEXT EXTRACTED:", rawText);
     const result = await this.parseEntireCv(rawText);
     /* data saveing logic here (e.g., save to DB) can be added before returning the result
    const savedCv = await this.cvService.saveIdentityCv(employeeId, pdfPath, result);
    await this.educationService.createParsedEducation(result.education, employeeId, savedCv);
    await this.certificationsService.createBulkFromParsedData(result.certifications, employeeId,pdfPath,savedCv);
    await this.projectsService.createBulkFromParsedData(result.projects, employeeId,savedCv);
    await this.experienceService.createBulkFromParsedData(result.experience, employeeId,savedCv);
    */
    return result ;
  }
// a supprimer
  async extractTextFromPdf(pdfPath: string): Promise<string> {
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
async parseEntireCv(rawText: string) {
    const cleanRaw = rawText.trim();
    const sections = this.splitSections(cleanRaw);

    // 1. On récupère les données via Heuristique
    const result = {
      contact: this.heuristicParser.extractContactInfo(sections.header, cleanRaw),
      experience: this.heuristicParser.extractExperience(sections.experience || ''),
      certifications: this.heuristicParser.extractCertifications(sections.certifications || ''),
      education: this.heuristicParser.extractEducation(sections.education || ''),
      projects: this.heuristicParser.extractProjects(sections.projects || ''),
      skills: this.heuristicParser.extractSkills(sections.skills || ''),
    };

    // 2. Boucle de réparation synchrone (for...of est obligatoire pour l'await)
    for (const key of Object.keys(result)) {
      if (this.isSectionInvalid(key, result[key])) {
        
        let contextForLlm = sections[key] || cleanRaw;

        // --- LOGIQUE SPÉCIFIQUE POUR LES SKILLS (Keywords) ---
        if (key === 'skills') {
          this.logger.warn(` [INFERENCE SKILLS] Extraction à partir du contenu global...`);
          // On combine Projets, Expériences et Certifs pour trouver les technos
          contextForLlm = `
            EXPÉRIENCES : ${JSON.stringify(result.experience)}
            PROJETS : ${JSON.stringify(result.projects)}
            CERTIFICATIONS : ${JSON.stringify(result.certifications)}
          `;
        }

        try {
          const repairedData = await this.llmService.repairSection(key, contextForLlm);
          
          if (repairedData && Array.isArray(repairedData) && repairedData.length > 0) {
            // CRITIQUE : On écrase l'ancienne valeur vide par la nouvelle
            result[key] = repairedData; 
            this.logger.log(` Section [${key}] mise à jour dans l'objet final.`);
          }
        } catch (e) {
          this.logger.error(` Erreur sur [${key}]`);
        }
      }
    }

    // À ce stade, result[key] DOIT contenir les données pour Postman
    return result; 
  }

  private splitSections(text: string) {
    const sectionMap = {
      experience: /(?:Expérience[s]?\s*professionnelle[s]?|Parcours\s*professionnel)/i,
      certifications: /(?:Certification[s]?|Certificat[s]?|Diplômes\s*et\s*Certificats)/i,
      education: /(?:Formation[s]?|Éducation|Cursus|Parcours\s*académique)/i,
      projects: /(?<!Chef\sde\s|Directeur\sde\s)\bProjet[s]?\b(?:\s*[:\n•]|\s{2,}|(?=\s+\d{4}))/i,
      skills: /\b(?:Compétence[s]?\s*(?:supplémentaire[s]?)?|Skills|Aptitude[s]?|Savoir-faire)\b/i,
        };

    const markers = Object.entries(sectionMap)
      .map(([key, regex]) => {
        const match = text.match(regex);
        return { key, index: match ? match.index : -1 };
      })
      .filter(m => m.index !== -1)
      .sort((a, b) => a.index - b.index);

    const result: any = { header: '' };
    result.header = text.substring(0, markers[0]?.index || text.length);

    for (let i = 0; i < markers.length; i++) {
      const start = markers[i].index;
      const end = markers[i + 1]?.index || text.length;
      result[markers[i].key] = text.substring(start, end);
    }
    return result;
  }

  private isSectionInvalid(key: string, data: any): boolean {
    if (!data) return true;
    if (Array.isArray(data) && data.length === 0) return true;

    switch (key) {
      case 'contact':
        return !data.email || !data.name; // Invalide si pas de mail ou nom
      case 'projects':
        // Invalide si trop de clients sont "Inconnu"
        const unknowns = data.filter(p => p.client === 'Inconnu').length;
        return unknowns > data.length / 2;
      default:
        return false;
    }
  }
}