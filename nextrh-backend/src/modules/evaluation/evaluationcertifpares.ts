import { Injectable } from '@nestjs/common';
import { ParserService } from '../../parser/parser.service'; 
import { LlmService } from '../../parser/llm.service';       
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EvaluationService {
  constructor(
    private readonly parserService: ParserService,
    private readonly llmService: LlmService,
  ) {}

  // 🧮 Academic NLP Helper: Levenshtein Distance Percentage Similarity
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = String(str1).trim().toLowerCase();
    const s2 = String(str2).trim().toLowerCase();
    
    if (s1 === s2) return 100;
    if (s1.length === 0 || s2.length === 0) return 0;

    const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    const distance = track[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return ((maxLength - distance) / maxLength) * 100;
  }

  async runTargetedEvaluation(targetType: string) {
    const groundTruthPath = path.resolve('src/modules/evaluation/data/ground-truth.json');
    
    if (!fs.existsSync(groundTruthPath)) {
      console.error(`❌ Ground truth file missing at: ${groundTruthPath}`);
      return;
    }

    const rawData = fs.readFileSync(groundTruthPath, 'utf8');
    const allDatasets = JSON.parse(rawData);
    const datasets = allDatasets.filter((item: any) => item.type === targetType);

    if (datasets.length === 0) {
      console.warn(`⚠️ No test cases found matching type: "${targetType}"`);
      return;
    }

    let totalFiles = datasets.length;
    let totalOcrSuccesses = 0;
    let totalLlmJsonPasses = 0;
    let globalAccuracySum = 0;
    let globalDuration = 0;

    console.log('\n🧪 =======================================================');
    console.log(`🚀 STARTING EVALUATION BENCHMARK: [ ${targetType.toUpperCase()} ]`);
    console.log('=======================================================\n');

    for (const item of datasets) {
      const fileName = path.basename(item.filePath);
      console.log(`-------------------------------------------------------`);
      console.log(`📄 Analyzing Document: ${fileName}`);
      console.log(`-------------------------------------------------------`);
      
      const startTime = Date.now();
      let isOcrSuccessful = false;
      let isLlmStructuralSuccess = false;
      let fileFieldsChecked = 0;
      let fileAccuracySum = 0;

      // --- 🟢 1. OCR LAYER ---
      let extractedText = '';
      try {
        extractedText = await this.parserService.extractTextFromPdf(item.filePath);
        if (extractedText.toLowerCase().includes(item.expectedOcrSnippet.toLowerCase())) {
          isOcrSuccessful = true;
          totalOcrSuccesses++;
        }
      } catch (ocrError) {
        console.error(`  ❌ [OCR Crash]: ${ocrError.message}`);
        continue;
      }

      // --- 🟡 2. LLM LAYER ---
      const llmOutput = await this.llmService.extractCertificate(extractedText);
      const endTime = Date.now();
      const executionTime = (endTime - startTime) / 1000;
      globalDuration += (endTime - startTime);

      if (!llmOutput || llmOutput.error) {
        console.error(`  ❌ [LLM Structure Failure]: Invalid JSON compiled schema output.`);
      } else {
        isLlmStructuralSuccess = true;
        totalLlmJsonPasses++;
      }

      // --- 📊 3. INDIVIDUAL FILE METRIC PROCESSING ---
      const expected = item.expectedJson;
      const targetKeys = ['certificate_name', 'certificate_holder', 'provider', 'date_of_obtention', 'date_of_expiration'];
      
      console.log(`\n  🔎 [Field Comparison Matrix]:`);
      targetKeys.forEach((key) => {
        fileFieldsChecked++;
        const actualValue = llmOutput ? llmOutput[key] : undefined;
        const expectedValue = expected[key];

        let fieldScore = 0;
        if (actualValue === null && expectedValue === null) {
          fieldScore = 100;
        } else if (actualValue && expectedValue) {
          fieldScore = this.calculateSimilarity(String(actualValue), String(expectedValue));
        } else if (!actualValue && !expectedValue) {
          fieldScore = 100; // Both undefined/null variants match perfectly
        }

        fileAccuracySum += fieldScore;
        console.log(`   • ${key.padEnd(20)} -> Match Quality: ${fieldScore.toFixed(1)}% | Expected: "${expectedValue}" <=> Got: "${actualValue}"`);
      });

      const fileFieldAccuracy = fileFieldsChecked > 0 ? (fileAccuracySum / fileFieldsChecked) : 0;
      globalAccuracySum += fileFieldAccuracy;

      // 📝 Individual Report Card Printed immediately 
      console.log(`\n  📊 [File Performance Card]:`);
      console.log(`   ⏱️  Latency           : ${executionTime.toFixed(2)} seconds`);
      console.log(`   👁️  OCR Anchoring     : ${isOcrSuccessful ? '🟢 PASSED' : '❌ FAILED'}`);
      console.log(`   🤖 LLM Structure     : ${isLlmStructuralSuccess ? '🟢 VALID' : '❌ CORRUPTED'}`);
      console.log(`   🎯 Text Fidelity Acc : ${fileFieldAccuracy.toFixed(1)}%\n`);
    }

    // --- 🧮 GLOBAL PERFORMANCE AGGREGATIONS ---
    const avgGlobalTime = (globalDuration / totalFiles) / 1000;
    const finalOcrRate = (totalOcrSuccesses / totalFiles) * 100;
    const finalJsonRate = (totalLlmJsonPasses / totalFiles) * 100;
    const finalGlobalAccuracy = (globalAccuracySum / totalFiles);

    console.log('\n=======================================================');
    console.log(`📊 FINAL GLOBAL ACADEMIC SYSTEM PERFORMANCE REPORT (${targetType.toUpperCase()})`);
    console.log('=======================================================');
    console.log(`📂 Total Evaluated Files     : ${totalFiles}`);
    console.log(`⏱️  System Average Latency   : ${avgGlobalTime.toFixed(2)} seconds`);
    console.log(`👁️  OCR Token Anchor Precision: ${finalOcrRate.toFixed(1)}%`);
    console.log(`🤖 Global Schema Reliability : ${finalJsonRate.toFixed(1)}%`);
    console.log(`🎯 Overall Field Text Fidelity: ${finalGlobalAccuracy.toFixed(1)}%`);
    console.log('=======================================================\n');
  }
}
/*import { NestFactory } from '@nestjs/core';
import { EvaluationModule } from './evaluation.module';
import { EvaluationService } from './evaluation.service';

async function bootstrap() {
  // Build a fast application context ignoring standard HTTP ports
  const app = await NestFactory.createApplicationContext(EvaluationModule);
  const evaluationService = app.get(EvaluationService);
  
  // Pick up whatever target you provide in the terminal command (defaults to 'certificate')
  const requestedTarget = process.argv[2] || 'certificate';

  try {
    await evaluationService.runTargetedEvaluation(requestedTarget);
  } catch (error) {
    console.error('❌ Critical failure running script runner:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();*/