import { Injectable, Logger } from '@nestjs/common';
import { CvParserFacade } from './cv-parser.facade'; 
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CvEvaluationService {
  private readonly logger = new Logger(CvEvaluationService.name);
  // Seuil académique de validation d'une entité (80% de ressemblance textuelle)
  private readonly SIMILARITY_THRESHOLD = 0.80; 

  constructor(private readonly cvParserFacade: CvParserFacade) {}

  async runAcademicEvaluation() {
    const testDataDir = path.join(process.cwd(), 'test', 'data');
    const groundTruthPath = path.join(testDataDir, 'cv-ground-truth.json');

    if (!fs.existsSync(groundTruthPath)) {
      this.logger.error(`Le fichier ground-truth.json est introuvable à cet endroit : ${groundTruthPath}`);
      throw new Error(`Ground truth database file missing at: ${groundTruthPath}`);
    }

    const dataset = JSON.parse(fs.readFileSync(groundTruthPath, 'utf8'));

    // Métriques globales d'évaluation NLP
    const metrics = {
      name: { tp: 0, fp: 0, fn: 0 },
      profession: { tp: 0, fp: 0, fn: 0 },
      phone: { tp: 0, fp: 0, fn: 0 },
      email: { tp: 0, fp: 0, fn: 0 },
      address: { tp: 0, fp: 0, fn: 0 },
      skills: { tp: 0, fp: 0, fn: 0 },
      experience: { tp: 0, fp: 0, fn: 0 },
      certifications: { tp: 0, fp: 0, fn: 0 },
      education: { tp: 0, fp: 0, fn: 0 },
      projects: { tp: 0, fp: 0, fn: 0 },
    };

    for (const testCase of dataset) {
      const samplePath = path.join(testDataDir, testCase.fileName);
      
      if (!fs.existsSync(samplePath)) {
        this.logger.warn(`Le fichier échantillon ${testCase.fileName} est absent du dossier test/data/. Passage au suivant.`);
        continue;
      }

      try {
        const fileBuffer = fs.readFileSync(samplePath);
        const response = await this.cvParserFacade.parseCv(fileBuffer);
        
        const parsedProfile = response?.data?.profile || {};
        const parsedExperiences = response?.data?.experience || [];
        const parsedCertifications = response?.data?.certifications || [];
        const parsedEducation = response?.data?.education || [];
        const parsedProjects = response?.data?.projects || [];

        // 1. Profil (Soft Match sur chaînes simples)
        this.computeTextSoftScores(testCase.expected.profile.name, parsedProfile.name, metrics.name);
        this.computeTextSoftScores(testCase.expected.profile.profession, parsedProfile.profession, metrics.profession);
        this.computeTextSoftScores(testCase.expected.profile.phone, parsedProfile.phone, metrics.phone);
        this.computeTextSoftScores(testCase.expected.profile.email, parsedProfile.email, metrics.email);
        this.computeTextSoftScores(testCase.expected.profile.address, parsedProfile.address, metrics.address);

        // 2. Compétences (Soft Match sur liste de chaînes)
        this.computeArraySoftScores(testCase.expected.profile.skills || [], parsedProfile.skills || [], metrics.skills);

        // 3. Objets complexes (Alignement flou multi-critères)
        this.computeObjectArraySoftScores(testCase.expected.experience || [], parsedExperiences, metrics.experience, ['company', 'period', 'role']);
        this.computeObjectArraySoftScores(testCase.expected.certifications || [], parsedCertifications, metrics.certifications, ['certName', 'date']);
        this.computeObjectArraySoftScores(testCase.expected.education || [], parsedEducation, metrics.education, ['institution', 'degree', 'year']);
        this.computeObjectArraySoftScores(testCase.expected.projects || [], parsedProjects, metrics.projects, ['client', 'description', 'year']);

      } catch (err) {
        this.logger.error(`Erreur lors du traitement académique de ${testCase.fileName}: ${err.message}`);
      }
    }

    return this.calculateFinalMatrix(metrics);
  }

  /**
   * Évaluation floue d'un champ texte unique basé sur Levenshtein
   */
  private computeTextSoftScores(expected: string, parsed: string, acc: { tp: number; fp: number; fn: number }) {
    const expClean = (expected || '').trim();
    const parseClean = (parsed || '').trim();

    if (!expClean && !parseClean) return;

    const similarity = this.calculateSimilarity(expClean, parseClean);

    if (similarity >= this.SIMILARITY_THRESHOLD) {
      acc.tp++; // Validé comme True Positive grâce au seuil sémantique flou
    } else {
      if (parseClean !== '') acc.fp++;
      if (expClean !== '') acc.fn++;
    }
  }

  /**
   * Évaluation floue d'un tableau d'entités (Skills)
   */
  private computeArraySoftScores(expectedList: string[], parsedList: string[], acc: { tp: number; fp: number; fn: number }) {
    const matchedParsedIndexes = new Set<number>();

    expectedList.forEach(expected => {
      const foundIdx = parsedList.findIndex((parsed, idx) => {
        if (matchedParsedIndexes.has(idx)) return false;
        return this.calculateSimilarity(expected, parsed) >= this.SIMILARITY_THRESHOLD;
      });

      if (foundIdx !== -1) {
        acc.tp++;
        matchedParsedIndexes.add(foundIdx);
      } else {
        acc.fn++;
      }
    });

    parsedList.forEach((_, idx) => {
      if (!matchedParsedIndexes.has(idx)) acc.fp++;
    });
  }

  /**
   * Alignement glissant flou pour les objets complexes (Moyenne des similarités des sous-champs)
   */
  private computeObjectArraySoftScores(expectedList: any[], parsedList: any[], acc: { tp: number; fp: number; fn: number }, fields: string[]) {
    const matchedParsedIndexes = new Set<number>();

    expectedList.forEach(expected => {
      let bestMatchIdx = -1;
      let maxObjectSimilarity = 0;

      parsedList.forEach((parsed, idx) => {
        if (matchedParsedIndexes.has(idx)) return;

        // Calcul du score moyen de ressemblance de l'objet complet
        let totalSimilarity = 0;
        fields.forEach(field => {
          totalSimilarity += this.calculateSimilarity(expected[field], parsed[field]);
        });
        const avgSimilarity = totalSimilarity / fields.length;

        if (avgSimilarity > maxObjectSimilarity) {
          maxObjectSimilarity = avgSimilarity;
          bestMatchIdx = idx;
        }
      });

      if (bestMatchIdx !== -1 && maxObjectSimilarity >= this.SIMILARITY_THRESHOLD) {
        acc.tp++;
        matchedParsedIndexes.add(bestMatchIdx);
      } else {
        acc.fn++;
      }
    });

    parsedList.forEach((_, idx) => {
      if (!matchedParsedIndexes.has(idx)) acc.fp++;
    });
  }

  /**
   * Algorithme standardisé NLP de distance de Levenshtein converti en taux de similarité [0, 1]
   */

  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = (str1 || '').toLowerCase().trim();
    const s2 = (str2 || '').toLowerCase().trim();

    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;

    const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // Suppression (corrigé de col - 1 à i - 1)
          track[j - 1][i] + 1, // Insertion
          track[j - 1][i - 1] + indicator // Substitution
        );
      }
    }

    const distance = track[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - distance / maxLength;
  }

   
  /**
   * Formulation standardisée de la Matrice NLP (Précision, Rappel, F1)
   */
  private calculateFinalMatrix(metrics: any) {
    const results: any = {};
    for (const field in metrics) {
      const { tp, fp, fn } = metrics[field];
      const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
      const recall = tp + fn === 0 ? 1 : tp / (tp + fn);
      const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

      results[field] = {
        precision: parseFloat(precision.toFixed(2)),
        recall: parseFloat(recall.toFixed(2)),
        f1Score: parseFloat(f1.toFixed(2)),
        matrix: { truePositive: tp, falsePositive: fp, falseNegative: fn }
      };
    }
    return results;
  }
}