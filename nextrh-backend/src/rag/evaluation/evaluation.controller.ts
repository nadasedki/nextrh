import {
  Controller, Post, Body, UseGuards,
  Logger, BadRequestException, HttpCode, HttpStatus,
} from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { RagPipelineService } from '../application/rag-pipeline.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import * as fs from 'fs';
import * as path from 'path';

@Controller('evaluation')
//@UseGuards(JwtAuthGuard, RolesGuard)
//@Roles('ADMIN')
export class EvaluationController {
  private readonly logger = new Logger(EvaluationController.name);

  // individual run log — append-only, one entry per test case per run
  private readonly INDIVIDUAL_RUNS_PATH = path.join(
    process.cwd(),
    'uploads/rag_individual_runs.json',
  );
  private readonly GLOBAL_REPORT_PATH = path.join(
    process.cwd(),
    'uploads/rag_metrics_report.json',
  );

  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly pipelineService: RagPipelineService,
  ) {}

  /**
   * POST /evaluation/run-single
   * Evaluates a single test case from the ground truth by index.
   * Saves the result and recalculates global averages over all completed runs.
   */
  @Post('run-single')
  @HttpCode(HttpStatus.OK)
  async runSingleEvaluation(@Body('testCaseIndex') testCaseIndex: number) {
    if (testCaseIndex === undefined || isNaN(testCaseIndex)) {
      throw new BadRequestException('Please provide a valid testCaseIndex.');
    }

    // delegate ground truth access to the service — single source of truth
    const testCase = this.evaluationService.getTestCase(testCaseIndex);
    if (!testCase) {
      throw new BadRequestException(
        `No test case found at index ${testCaseIndex}. ` +
        `Check test/data/rag_ground_truth.json.`,
      );
    }

    this.logger.log(`[EVAL-SINGLE #${testCaseIndex}] Query: "${testCase.query}"`);

    // run the RAG pipeline
    const state = await this.pipelineService.run(testCase.query);

    // extract answer field only — consistent with evaluation.service.ts
    const answerOnly   = state.structuredAnswer?.answer ?? state.answer ?? '';
    const reasoning    = state.structuredAnswer?.reasoning ?? '';
    const explanation  = state.structuredAnswer?.explanation ?? '';
    const confidence   = state.structuredAnswer?.confidence ?? 0;

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

    // compute metrics — no pre-computed vec here since this is a single call
    const metrics = await this.evaluationService.evaluate(
      {
        query:               testCase.query,
        expectedDocIds:      testCase.expected_doc_ids,
        retrievedDocIds,
        expectedAnswer:      testCase.expected_answer,
        generatedAnswer:     answerOnly,
        retrievedContextText,
      },
      textForFaithfulness,
    );

    // load existing individual runs
    let savedRuns: any[] = [];
    if (fs.existsSync(this.INDIVIDUAL_RUNS_PATH)) {
      try {
        savedRuns = JSON.parse(fs.readFileSync(this.INDIVIDUAL_RUNS_PATH, 'utf-8'));
      } catch {
        savedRuns = [];
      }
    }

    const newRun = {
      testCaseIndex,
      query:             testCase.query,
      category:          testCase.category,
      expected_answer:   testCase.expected_answer,
      generated_answer:  answerOnly,
      reasoning,
      explanation,
      confidence,
      retrieved_doc_ids: retrievedDocIds,
      metrics,
      evaluatedAt:       new Date().toISOString(),
    };

    // upsert: overwrite if already evaluated, append if new
    const existingIdx = savedRuns.findIndex(r => r.testCaseIndex === testCaseIndex);
    if (existingIdx > -1) {
      savedRuns[existingIdx] = newRun;
    } else {
      savedRuns.push(newRun);
    }

    // persist individual runs
    const dir = path.dirname(this.INDIVIDUAL_RUNS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.INDIVIDUAL_RUNS_PATH, JSON.stringify(savedRuns, null, 2), 'utf-8');

    // recalculate global averages incrementally over all completed runs
    const count = savedRuns.length;
    const sums = savedRuns.reduce((acc, run) => {
      acc.p3          += run.metrics.precisionAt3;
      acc.r3          += run.metrics.recallAt3;
      acc.p5          += run.metrics.precisionAt5;
      acc.r5          += run.metrics.recallAt5;
      acc.mrr         += run.metrics.mrr;
      acc.rougeL      += run.metrics.rougeLScore;
      acc.faithfulness += run.metrics.faithfulnessScore;
      acc.semantic    += run.metrics.semanticSimilarityScore;
      if (run.metrics.success) acc.successes++;
      return acc;
    }, { p3: 0, r3: 0, p5: 0, r5: 0, mrr: 0, rougeL: 0, faithfulness: 0, semantic: 0, successes: 0 });

    const globalReport = {
      evaluatedAt: new Date().toISOString(),
      successCriteria: {
        faithfulnessThreshold: this.evaluationService.FAITHFULNESS_SUCCESS_THRESHOLD,
        rougeLThreshold:       this.evaluationService.ROUGE_SUCCESS_THRESHOLD,
        semanticThreshold:     this.evaluationService.SEMANTIC_SUCCESS_THRESHOLD,
        logic: 'faithfulness >= 0.7 AND (rougeL >= 0.5 OR semantic >= 0.75)',
      },
      summary: {
        totalQueriesEvaluated:         count,
        globalPrecisionAt3:            parseFloat((sums.p3          / count).toFixed(4)),
        globalRecallAt3:               parseFloat((sums.r3          / count).toFixed(4)),
        globalPrecisionAt5:            parseFloat((sums.p5          / count).toFixed(4)),
        globalRecallAt5:               parseFloat((sums.r5          / count).toFixed(4)),
        globalMRR:                     parseFloat((sums.mrr         / count).toFixed(4)),
        globalRougeLScore:             parseFloat((sums.rougeL      / count).toFixed(4)),
        globalFaithfulness:            parseFloat((sums.faithfulness / count).toFixed(4)),
        globalSemanticSimilarityScore: parseFloat((sums.semantic    / count).toFixed(4)),
        globalSuccessRate:             parseFloat((sums.successes   / count).toFixed(4)),
      },
    };

    fs.writeFileSync(
      this.GLOBAL_REPORT_PATH,
      JSON.stringify(globalReport, null, 2),
      'utf-8',
    );

    this.logger.log(
      `[EVAL] Test case #${testCaseIndex} done. Global report updated (${count} runs).`,
    );

    return {
      message:       `Test case #${testCaseIndex} evaluated. Global metrics recalculated over ${count} runs.`,
      currentRun:    newRun,
      globalSummary: globalReport.summary,
    };
  }
}