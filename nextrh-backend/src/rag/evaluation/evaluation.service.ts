import { Injectable, Logger } from '@nestjs/common';
import { RagPipelineService } from '../application/rag-pipeline.service'; // Adjust relative path if needed
import * as fs from 'fs';
import * as path from 'path';

// --- INTERFACES ---

export interface RagEvaluationInput {
  query: string;
  expectedDocIds: string[];
  retrievedDocIds: string[];
  expectedAnswer: string;
  generatedAnswer: string;
  retrievedContextText: string;
}

export interface RagEvaluationResult {
  precisionAtK: number;
  recallAtK: number;
  mrr: number;
  rougeLScore: number;
  faithfulnessScore: number;
  success: boolean;
}

interface RagGroundTruthCase {
  query: string;
  expected_doc_ids: string[];
  expected_answer: string;
}

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  private readonly ROUGE_SUCCESS_THRESHOLD = 0.5;
  private readonly FAITHFULNESS_SUCCESS_THRESHOLD = 0.7;

  constructor(
    private readonly pipeline: RagPipelineService, // Injected to execute queries during the benchmark
  ) {}

  /**
   * Runs the automated RAG offline evaluation suite, compiles the report, and saves it.
   */
  public async runEvaluationSuite(): Promise<any> {
    this.logger.log('🚀 Initiating automated RAG metrics evaluation suite...');
    const groundTruthPath = path.join(process.cwd(), 'test/data/rag_ground_truth.json');
    const outputPath = path.join(process.cwd(), 'uploads/rag_metrics_report.json');

    if (!fs.existsSync(groundTruthPath)) {
      throw new Error(`RAG ground truth file not found at ${groundTruthPath}`);
    }

    const groundTruth: { test_cases: RagGroundTruthCase[] } = JSON.parse(
      fs.readFileSync(groundTruthPath, 'utf-8'),
    );

    const detailsLog: any[] = [];
    let totalPrecision = 0;
    let totalRecall = 0;
    let totalMRR = 0;
    let totalRougeL = 0;
    let totalSuccessCount = 0;

    const cases = groundTruth.test_cases;

    for (const testCase of cases) {
      this.logger.log(`Evaluating RAG query: "${testCase.query}"...`);

      try {
        // 1. Run the query through the pipeline
        const pipelineResult = await this.pipeline.run(testCase.query);

        // 2. Map pipeline sources to actual text and IDs
        const retrievedDocIds = pipelineResult.sources.map(s => String(s.cv_id || s.id || ''));
        const retrievedContextText = pipelineResult.sources.map(s => String(s.text || s.content || '')).join('\n');

        const evalInput: RagEvaluationInput = {
          query: testCase.query,
          expectedDocIds: testCase.expected_doc_ids,
          retrievedDocIds,
          expectedAnswer: testCase.expected_answer,
          generatedAnswer: pipelineResult.answer,
          retrievedContextText,
        };

        // 3. Compute metrics locally using our pure TypeScript methods
        const metrics = this.evaluate(evalInput);

        totalPrecision += metrics.precisionAtK;
        totalRecall += metrics.recallAtK;
        totalMRR += metrics.mrr;
        totalRougeL += metrics.rougeLScore;
        if (metrics.success) totalSuccessCount++;

        detailsLog.push({
          query: testCase.query,
          metrics,
          generated_answer: pipelineResult.answer,
          expected_answer: testCase.expected_answer,
          retrieved_sources_ids: retrievedDocIds,
        });

      } catch (error) {
        this.logger.error(`Failed to evaluate query "${testCase.query}": ${error.message}`);
      }
    }

    const testCasesCount = cases.length;
    const globalPrecision = testCasesCount > 0 ? totalPrecision / testCasesCount : 0;
    const globalRecall = testCasesCount > 0 ? totalRecall / testCasesCount : 0;
    const globalMRR = testCasesCount > 0 ? totalMRR / testCasesCount : 0;
    const globalRougeL = testCasesCount > 0 ? totalRougeL / testCasesCount : 0;
    const successRate = testCasesCount > 0 ? totalSuccessCount / testCasesCount : 0;

    const report = {
      evaluatedAt: new Date().toISOString(),
      summary: {
        totalQueriesEvaluated: testCasesCount,
        globalPrecisionAtK: parseFloat(globalPrecision.toFixed(4)),
        globalRecallAtK: parseFloat(globalRecall.toFixed(4)),
        globalMRR: parseFloat(globalMRR.toFixed(4)),
        globalRougeLScore: parseFloat(globalRougeL.toFixed(4)),
        globalSuccessRate: parseFloat(successRate.toFixed(4)),
      },
      details: detailsLog,
    };

    // Save report to disk
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    this.logger.log(`RAG evaluation report saved successfully to ${outputPath}`);

    return report;
  }

  /**
   * Computes the 3-level evaluation metrics for a single input.
   */
  public evaluate(input: RagEvaluationInput, k: number = 3): RagEvaluationResult {
    const precisionAtK = this.calculatePrecisionAtK(input.retrievedDocIds, input.expectedDocIds, k);
    const recallAtK = this.calculateRecallAtK(input.retrievedDocIds, input.expectedDocIds, k);
    const mrr = this.calculateMRR(input.retrievedDocIds, input.expectedDocIds);
    const rougeLScore = this.calculateRougeL(input.expectedAnswer, input.generatedAnswer);
    const faithfulnessScore = this.calculateFaithfulness(input.generatedAnswer, input.retrievedContextText);

    const success = 
      faithfulnessScore >= this.FAITHFULNESS_SUCCESS_THRESHOLD && 
      rougeLScore >= this.ROUGE_SUCCESS_THRESHOLD;

    return {
      precisionAtK,
      recallAtK,
      mrr,
      rougeLScore,
      faithfulnessScore,
      success,
    };
  }

  private calculatePrecisionAtK(retrieved: string[], expected: string[], k: number): number {
    if (k === 0 || retrieved.length === 0) return 0.0;
    const topKRetrieved = retrieved.slice(0, k);
    const relevantCount = topKRetrieved.filter(id => expected.includes(id)).length;
    return parseFloat((relevantCount / k).toFixed(4));
  }

  private calculateRecallAtK(retrieved: string[], expected: string[], k: number): number {
    if (expected.length === 0 || retrieved.length === 0) return 0.0;
    const topKRetrieved = retrieved.slice(0, k);
    const relevantCount = topKRetrieved.filter(id => expected.includes(id)).length;
    return parseFloat((relevantCount / expected.length).toFixed(4));
  }

  private calculateMRR(retrieved: string[], expected: string[]): number {
    for (let i = 0; i < retrieved.length; i++) {
      if (expected.includes(retrieved[i])) {
        return parseFloat((1 / (i + 1)).toFixed(4)); // 1 / Rank index (1-based)
      }
    }
    return 0.0;
  }

  /**
   * Word-Level ROUGE-L (Longest Common Subsequence)
   */
  public calculateRougeL(referenceText: string, generatedText: string): number {
    const refWords = this.tokenizeAndNormalize(referenceText);
    const genWords = this.tokenizeAndNormalize(generatedText);

    const m = refWords.length;
    const n = genWords.length;

    if (m === 0 || n === 0) return 0.0;

    const lcsLength = this.getLcsLength(refWords, genWords);

    const recall = lcsLength / m;
    const precision = lcsLength / n;

    if (recall + precision === 0) return 0.0;

    const f1 = (2 * recall * precision) / (recall + precision);
    return parseFloat(f1.toFixed(4));
  }

  /**
   * Word-level Faithfulness (Linguistic overlap of generation vs context)
   */
  private calculateFaithfulness(answer: string, context: string): number {
    const answerWords = this.tokenizeAndNormalize(answer);
    const contextWords = new Set(this.tokenizeAndNormalize(context));

    if (answerWords.length === 0) return 0.0;

    let supportedWordsCount = 0;

    for (const word of answerWords) {
      if (contextWords.has(word)) {
        supportedWordsCount++;
      }
    }

    return parseFloat((supportedWordsCount / answerWords.length).toFixed(4));
  }

  /**
   * Space-optimized LCS dynamic programming array
   */
  private getLcsLength(words1: string[], words2: string[]): number {
    const m = words1.length;
    const n = words2.length;
    
    let prevRow = Array(n + 1).fill(0);
    let currRow = Array(n + 1).fill(0);

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (words1[i - 1] === words2[j - 1]) {
          currRow[j] = prevRow[j - 1] + 1;
        } else {
          currRow[j] = Math.max(prevRow[j], currRow[j - 1]);
        }
      }
      prevRow = [...currRow];
    }
    return currRow[n];
  }

  private tokenizeAndNormalize(text: string): string[] {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }
}