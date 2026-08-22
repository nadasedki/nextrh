
import { Injectable, Logger } from '@nestjs/common';
import { RagPipelineService } from '../application/rag-pipeline.service';
import { EmbeddingService } from '../embedding/embedding.service';
import * as fs from 'fs';
import * as path from 'path';
import { RagState } from '../types/rag-state';
import { 
  RagEvaluationInput, 
  RagEvaluationResult, 
  EvaluationDetailEntry, 
  RagGroundTruthCase,  
  EvaluationReport 
} from '../types/evaluation.types'; 

// ─── SERVICE ──────────────────────────────────────────────────────────────────

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  readonly ROUGE_SUCCESS_THRESHOLD        = 0.5;
  readonly FAITHFULNESS_SUCCESS_THRESHOLD = 0.7;
  readonly SEMANTIC_SUCCESS_THRESHOLD     = 0.75;

  readonly GROUND_TRUTH_PATH = path.join(
    process.cwd(),
    'test/data/rag_ground_truth.json',
  );
  private readonly OUTPUT_PATH = path.join(
    process.cwd(),
    'uploads/rag_metrics_report.json',
  );

  constructor(
    private readonly pipeline: RagPipelineService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  // ─── PUBLIC: single test case access for controller ──────────────────────

  getTestCase(index: number): RagGroundTruthCase | null {
    if (!fs.existsSync(this.GROUND_TRUTH_PATH)) return null;
    const gt = JSON.parse(fs.readFileSync(this.GROUND_TRUTH_PATH, 'utf-8'));
    return gt.test_cases?.[index] ?? null;
  }

  getAllTestCases(): RagGroundTruthCase[] {
    if (!fs.existsSync(this.GROUND_TRUTH_PATH)) return [];
    const gt = JSON.parse(fs.readFileSync(this.GROUND_TRUTH_PATH, 'utf-8'));
    return gt.test_cases ?? [];
  }

  // ─── FULL EVALUATION SUITE ───────────────────────────────────────────────

  async runEvaluationSuite(): Promise<EvaluationReport> {
    this.logger.log('Starting RAG evaluation suite...');

    if (!fs.existsSync(this.GROUND_TRUTH_PATH)) {
      throw new Error(`Ground truth file not found at ${this.GROUND_TRUTH_PATH}`);
    }

    const testCases = this.getAllTestCases();

    // pre-compute expected answer embeddings once — avoids N extra API calls in the loop
    this.logger.log('Pre-computing expected answer embeddings...');
    const expectedEmbeddings = new Map<string, number[]>();
    for (const tc of testCases) {
      if (!expectedEmbeddings.has(tc.expected_answer)) {
        const vec = await this.embeddingService.embed(tc.expected_answer);
        expectedEmbeddings.set(tc.expected_answer, vec);
      }
    }

    const details: EvaluationDetailEntry[] = [];
    let totalP3 = 0, totalR3 = 0, totalP5 = 0, totalR5 = 0;
    let totalMRR = 0, totalRougeL = 0, totalFaithfulness = 0;
    let totalSemantic = 0, totalSuccess = 0;
    let totalMRRNoRerank = 0, totalP3NoRerank = 0;

    for (const testCase of testCases) {
      this.logger.log(`Evaluating [${testCase.category}]: "${testCase.query}"`);

      try {
        const state: RagState = await this.pipeline.run(testCase.query);

        // extract the answer field only — not the full structured output string
        // this ensures semantic comparison is between two short, comparable texts
        const answerOnly = state.structuredAnswer?.answer ?? state.answer ?? '';

    const textForFaithfulness = answerOnly;
    
const retrievedDocIds = state.reranked.map(r => {
          const userId = r.payload?.user_id ?? '';
          const type   = r.payload?.type    ?? '';
          return `${userId}_${type}`;
        });

        const retrievedContextText = state.reranked
          .map(r => r.payload?.text ?? '')
          .filter(t => t.length > 0)
          .join('\n');

        const evalInput: RagEvaluationInput = {
          query:               testCase.query,
          expectedDocIds:      testCase.expected_doc_ids,
          retrievedDocIds,
          expectedAnswer:      testCase.expected_answer,
          generatedAnswer:     answerOnly,
          retrievedContextText,
        };

        // reuse pre-computed expected embedding — no extra API call
        const expectedVec = expectedEmbeddings.get(testCase.expected_answer)!;
        const metrics = await this.evaluate(evalInput, textForFaithfulness, expectedVec);

        totalP3          += metrics.precisionAt3;
        totalR3          += metrics.recallAt3;
        totalP5          += metrics.precisionAt5;
        totalR5          += metrics.recallAt5;
        totalMRR         += metrics.mrr;
        totalRougeL      += metrics.rougeLScore;
        totalFaithfulness += metrics.faithfulnessScore;
        totalSemantic    += metrics.semanticSimilarityScore;
        if (metrics.success) totalSuccess++;

      // ablation — same query without reranking
        const stateNoRerank  = await this.pipeline.runWithoutReranking(testCase.query);
        const noRerankDocIds = stateNoRerank.reranked.map(r => {
          const userId = r.payload?.user_id ?? '';
          const type   = r.payload?.type    ?? '';
          return `${userId}_${type}`;
        });
          totalMRRNoRerank += this.calculateMRR(noRerankDocIds, testCase.expected_doc_ids);
        totalP3NoRerank  += this.calculatePrecisionAtK(noRerankDocIds, testCase.expected_doc_ids, 3);

        details.push({
          query:                  testCase.query,
          category:               testCase.category,
          metrics,
          generated_answer:       answerOnly,
          expected_answer:        testCase.expected_answer,
          retrieved_sources_ids:  retrievedDocIds,
        });

      } catch (err: any) {
        this.logger.error(`Failed to evaluate "${testCase.query}": ${err.message}`);
      }
    }

    const count = testCases.length || 1;

    // per-category breakdown
    const byCategory: Record<string, EvaluationDetailEntry[]> = {};
    for (const d of details) {
      const cat = d.category ?? 'uncategorized';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(d);
    }

    const categoryBreakdown: EvaluationReport['categoryBreakdown'] = {};
    for (const [cat, entries] of Object.entries(byCategory)) {
      const n = entries.length;
      categoryBreakdown[cat] = {
        count:              n,
        avgMRR:             parseFloat((entries.reduce((s, e) => s + e.metrics.mrr, 0) / n).toFixed(4)),
        avgPrecisionAt3:    parseFloat((entries.reduce((s, e) => s + e.metrics.precisionAt3, 0) / n).toFixed(4)),
        avgRecallAt3:       parseFloat((entries.reduce((s, e) => s + e.metrics.recallAt3, 0) / n).toFixed(4)),
        avgRougeL:          parseFloat((entries.reduce((s, e) => s + e.metrics.rougeLScore, 0) / n).toFixed(4)),
        avgSemanticSimilarity: parseFloat((entries.reduce((s, e) => s + e.metrics.semanticSimilarityScore, 0) / n).toFixed(4)),
      };
    }

    const globalMRR        = totalMRR / count;
    const globalP3         = totalP3  / count;
    const globalMRRNoRerank = totalMRRNoRerank / count;
    const globalP3NoRerank  = totalP3NoRerank  / count;

    const report: EvaluationReport = {
      evaluatedAt: new Date().toISOString(),
      successCriteria: {
        faithfulnessThreshold: this.FAITHFULNESS_SUCCESS_THRESHOLD,
        rougeLThreshold:       this.ROUGE_SUCCESS_THRESHOLD,
        semanticThreshold:     this.SEMANTIC_SUCCESS_THRESHOLD,
        logic: 'faithfulness >= 0.7 AND (rougeL >= 0.5 OR semantic >= 0.75)',
      },
      summary: {
        totalQueriesEvaluated:     count,
        globalPrecisionAt3:        parseFloat(globalP3.toFixed(4)),
        globalRecallAt3:           parseFloat((totalR3 / count).toFixed(4)),
        globalPrecisionAt5:        parseFloat((totalP5 / count).toFixed(4)),
        globalRecallAt5:           parseFloat((totalR5 / count).toFixed(4)),
        globalMRR:                 parseFloat(globalMRR.toFixed(4)),
        globalRougeLScore:         parseFloat((totalRougeL / count).toFixed(4)),
        globalFaithfulness:        parseFloat((totalFaithfulness / count).toFixed(4)),
        globalSemanticSimilarityScore: parseFloat((totalSemantic / count).toFixed(4)),
        globalSuccessRate:         parseFloat((totalSuccess / count).toFixed(4)),
      },
      ablation: {
        mrrWithReranking:             parseFloat(globalMRR.toFixed(4)),
        mrrWithoutReranking:          parseFloat(globalMRRNoRerank.toFixed(4)),
        mrrImprovement:               parseFloat((globalMRR - globalMRRNoRerank).toFixed(4)),
        precisionAt3WithReranking:    parseFloat(globalP3.toFixed(4)),
        precisionAt3WithoutReranking: parseFloat(globalP3NoRerank.toFixed(4)),
        precisionAt3Improvement:      parseFloat((globalP3 - globalP3NoRerank).toFixed(4)),
      },
      categoryBreakdown,
      details,
    };

    const outputDir = path.dirname(this.OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(this.OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf-8');
    this.logger.log(`Evaluation report saved to ${this.OUTPUT_PATH}`);

    return report;
  }

  // ─── SINGLE QUERY EVALUATION ─────────────────────────────────────────────

  // accepts a pre-computed expected embedding to avoid redundant API calls
  public async evaluate(
    input: RagEvaluationInput,
    textForFaithfulness?: string,
    precomputedExpectedVec?: number[],
  ): Promise<RagEvaluationResult> {
    const precisionAt3 = this.calculatePrecisionAtK(input.retrievedDocIds, input.expectedDocIds, 3);
    const recallAt3    = this.calculateRecallAtK(input.retrievedDocIds, input.expectedDocIds, 3);
    const precisionAt5 = this.calculatePrecisionAtK(input.retrievedDocIds, input.expectedDocIds, 5);
    const recallAt5    = this.calculateRecallAtK(input.retrievedDocIds, input.expectedDocIds, 5);
    const mrr          = this.calculateMRR(input.retrievedDocIds, input.expectedDocIds);
    const rougeLScore  = this.calculateRougeL(input.expectedAnswer, input.generatedAnswer);

    // semantic similarity between expected answer and generated answer
    // both should be short answer-field texts for comparable embedding space
    const expectedVec  = precomputedExpectedVec ?? await this.embeddingService.embed(input.expectedAnswer);
    const generatedVec = await this.embeddingService.embed(input.generatedAnswer);
    const semanticSimilarityScore = this.calculateCosineSimilarity(expectedVec, generatedVec);

    const faithfulnessText  = textForFaithfulness ?? input.generatedAnswer;
    const faithfulnessScore = this.calculateFaithfulness(faithfulnessText, input.retrievedContextText);

    // success: grounded in context AND (lexically close OR semantically close to reference)
    const success =
      faithfulnessScore >= this.FAITHFULNESS_SUCCESS_THRESHOLD &&
      (rougeLScore >= this.ROUGE_SUCCESS_THRESHOLD || semanticSimilarityScore >= this.SEMANTIC_SUCCESS_THRESHOLD);

    return {
      precisionAt3, recallAt3,
      precisionAt5, recallAt5,
      mrr, rougeLScore,
      faithfulnessScore,
      semanticSimilarityScore,
      success,
    };
  }

  // ─── METRIC IMPLEMENTATIONS ──────────────────────────────────────────────

  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length) return 0.0;

    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot   += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0.0;
    return parseFloat((dot / (Math.sqrt(normA) * Math.sqrt(normB))).toFixed(4));
  }

  private calculatePrecisionAtK(retrieved: string[], expected: string[], k: number): number {
    if (k === 0 || retrieved.length === 0) return 0.0;
    const relevant = retrieved.slice(0, k).filter(id => expected.includes(id)).length;
    return parseFloat((relevant / k).toFixed(4));
  }

  private calculateRecallAtK(retrieved: string[], expected: string[], k: number): number {
    if (expected.length === 0 || retrieved.length === 0) return 0.0;
    const relevant = retrieved.slice(0, k).filter(id => expected.includes(id)).length;
    return parseFloat((relevant / expected.length).toFixed(4));
  }

  private calculateMRR(retrieved: string[], expected: string[]): number {
    for (let i = 0; i < retrieved.length; i++) {
      if (expected.includes(retrieved[i])) return parseFloat((1 / (i + 1)).toFixed(4));
    }
    return 0.0;
  }

  public calculateRougeL(referenceText: string, generatedText: string): number {
    const refWords = this.tokenizeAndNormalize(referenceText);
    const genWords = this.tokenizeAndNormalize(generatedText);
    const m = refWords.length;
    const n = genWords.length;
    if (m === 0 || n === 0) return 0.0;
    const lcs       = this.getLcsLength(refWords, genWords);
    const recall    = lcs / m;
    const precision = lcs / n;
    if (recall + precision === 0) return 0.0;
    return parseFloat(((2 * recall * precision) / (recall + precision)).toFixed(4));
  }

  private calculateFaithfulness(answer: string, context: string): number {
    const answerWords  = this.tokenizeAndNormalize(answer);
    const contextWords = new Set(this.tokenizeAndNormalize(context));
    if (answerWords.length === 0) return 0.0;
    const supported = answerWords.filter(w => contextWords.has(w)).length;
    return parseFloat((supported / answerWords.length).toFixed(4));
  }

  private getLcsLength(w1: string[], w2: string[]): number {
    const n = w2.length;
    let prev = Array(n + 1).fill(0);
    let curr = Array(n + 1).fill(0);
    for (let i = 1; i <= w1.length; i++) {
      for (let j = 1; j <= n; j++) {
        curr[j] = w1[i - 1] === w2[j - 1]
          ? prev[j - 1] + 1
          : Math.max(prev[j], curr[j - 1]);
      }
      prev = [...curr];
      curr = Array(n + 1).fill(0);
    }
    return prev[n];
  }

  private tokenizeAndNormalize(text: string): string[] {
    return (text ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }
}