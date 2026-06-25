import { Injectable, Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import * as fs from 'fs';
import * as path from 'path';

interface ExpectedFields {
  certName: string;
  provider: string;
  issueDate: string;
  expiryDate: string;
  rawText?: string;
}

@Injectable()
export class EvaluationMetricsService {
  private readonly logger = new Logger(EvaluationMetricsService.name);

  constructor(private readonly aiService: AiService) {}

  async runEvaluationAndSaveJson(): Promise<void> {
    const groundTruthPath = path.join(process.cwd(), 'test/data/ground_truth.json');
    const outputPath = path.join(process.cwd(), 'uploads/metrics_report.json');

    if (!fs.existsSync(groundTruthPath)) {
      throw new Error(`Ground truth file not found at ${groundTruthPath}`);
    }

    const groundTruth: Record<string, ExpectedFields> = JSON.parse(
      fs.readFileSync(groundTruthPath, 'utf-8'),
    );
let totalTP = 0;
let totalFP = 0;
let totalFN = 0;

let totalEvaluatedFields = 0;
let exactMatchFiles = 0;

// Pour l'OCR global
let totalOcrAccuracyScore = 0;
let filesWithOcrCount = 0;
// Pour la confiance Tesseract globale (estimée)
let totalTesseractConfidenceScore = 0;
let filesWithConfidenceCount = 0;
const detailsLog: any[] = [];

for (const [filePath, expected] of Object.entries(groundTruth)) {
  this.logger.log(`Evaluating file: ${filePath}...`);

  let parsed: Partial<ExpectedFields> = {};
  let ocrTextExtracted = '';
  let ocrAccuracy: number | null = null;
  let tesseractConfidence: number | null = null; 
  try {
    const aiResponse = await this.aiService.extractCertificate2(filePath);

    if (aiResponse) {
      ocrTextExtracted = aiResponse.ocrText || '';
      tesseractConfidence = aiResponse.ocrConfidence || 0;
      //  Accumuler le score de confiance s'il existe
      if (tesseractConfidence !== null) {
        totalTesseractConfidenceScore += tesseractConfidence;
        filesWithConfidenceCount++;
      }
      if (expected.rawText) {
        ocrAccuracy = this.getLevenshteinSimilarity(
          ocrTextExtracted,
          expected.rawText,
        );

        totalOcrAccuracyScore += ocrAccuracy;
        filesWithOcrCount++;
      }

      parsed = {
        certName:
          aiResponse.certificate_name || aiResponse.certName || '',
        provider: aiResponse.provider || '',
        issueDate:
          aiResponse.date_of_obtention || aiResponse.issueDate || '',
        expiryDate:
          aiResponse.date_of_expiration || aiResponse.expiryDate || '',
      };
    }
  } catch (error) {
    this.logger.error(
      `Failed to parse ${filePath}: ${error.message}`,
    );
  }

  const fieldsToEvaluate: Array<keyof ExpectedFields> = [
    'certName',
    'provider',
    'issueDate',
    'expiryDate',
  ];

  const fileMetrics = {
    tp: 0,
    fp: 0,
    fn: 0,
  };

  let filePerfect = true;

  for (const field of fieldsToEvaluate) {
    const parsedValue = this.normalize(
      String(parsed[field] ?? ''),
    );

    const expectedValue = this.normalize(
      String(expected[field] ?? ''),
    );

    const expectedExists = expectedValue.length > 0;
    const parsedExists = parsedValue.length > 0;

    // Cas 1 : vide / vide => ignoré
    if (!expectedExists && !parsedExists) {
      continue;
    }

    totalEvaluatedFields++;

    // Cas 2 : exact match
    if (
      expectedExists &&
      parsedExists &&
      parsedValue === expectedValue
    ) {
      fileMetrics.tp++;
      totalTP++;
      continue;
    }

    filePerfect = false;

    // Cas 3 : attendu mais absent
    if (expectedExists && !parsedExists) {
      fileMetrics.fn++;
      totalFN++;
      continue;
    }

    // Cas 4 : extrait alors que non attendu
    if (!expectedExists && parsedExists) {
      fileMetrics.fp++;
      totalFP++;
      continue;
    }

    // Cas 5 : mauvaise valeur
    if (
      expectedExists &&
      parsedExists &&
      parsedValue !== expectedValue
    ) {
      fileMetrics.fp++;
      fileMetrics.fn++;

      totalFP++;
      totalFN++;
    }
  }

  if (filePerfect) {
    exactMatchFiles++;
  }

  detailsLog.push({
    file: filePath,
    ocrAccuracy,
    tesseractConfidence, 
    extracted: parsed,
    expected,
    metricsForFile: fileMetrics,
  });
}

// Métriques globales
const precision =
  totalTP + totalFP > 0
    ? totalTP / (totalTP + totalFP)
    : 0;

const recall =
  totalTP + totalFN > 0
    ? totalTP / (totalTP + totalFN)
    : 0;

const f1Score =
  precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : 0;

const globalOcrAccuracy =
  filesWithOcrCount > 0
    ? totalOcrAccuracyScore / filesWithOcrCount
    : 0;
const globalTesseractConfidence = 
filesWithConfidenceCount > 0 
? totalTesseractConfidenceScore / filesWithConfidenceCount : 0;

const exactMatchAccuracy =
  Object.keys(groundTruth).length > 0
    ? exactMatchFiles / Object.keys(groundTruth).length
    : 0;

const report = {
  evaluatedAt: new Date().toISOString(),
  summary: {
    totalFilesEvaluated: Object.keys(groundTruth).length,
    totalFieldsEvaluated: totalEvaluatedFields,

    globalPrecision: Number(precision.toFixed(4)),
    globalRecall: Number(recall.toFixed(4)),
    globalF1Score: Number(f1Score.toFixed(4)),

    exactMatchAccuracy: Number(
      exactMatchAccuracy.toFixed(4),
    ),

    globalOcrAccuracy: Number(
      globalOcrAccuracy.toFixed(4),
    ),
     globalTesseractConfidence: Number((
      globalTesseractConfidence / 100).toFixed(4)),
       
    totalTruePositives: totalTP,
    totalFalsePositives: totalFP,
    totalFalseNegatives: totalFN,
  },

  details: detailsLog,
};

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    this.logger.log(`Detailed metrics report saved successfully to ${outputPath}`);
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }
private getLevenshteinSimilarity(str1: string, str2: string): number {
  const s1 = this.normalizeOcrText(str1);
  const s2 = this.normalizeOcrText(str2);
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  let prevRow = Array(s1.length + 1).fill(0).map((_, i) => i);
  let currRow = Array(s1.length + 1).fill(0);

  for (let j = 1; j <= s2.length; j++) {
    currRow[0] = j;
    for (let i = 1; i <= s1.length; i++) {
      const match = s1[i - 1] === s2[j - 1] ? 0 : 1;
      currRow[i] = Math.min(
        prevRow[i] + 1,        // Deletion
        currRow[i - 1] + 1,    // Insertion
        prevRow[i - 1] + match // Substitution
      );
    }
    prevRow = [...currRow];
  }
  
  const distance = currRow[s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return parseFloat(((maxLength - distance) / maxLength).toFixed(4));
}
  private normalizeOcrText(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
}