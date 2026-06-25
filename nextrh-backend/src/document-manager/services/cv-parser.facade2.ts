import { Injectable, Logger } from '@nestjs/common';
import { CvHeuristicParserService } from './cv-heuristic-parser.service';
import { OcrService } from './ocr.service';
import { ChatOllama } from '@langchain/ollama';
import { CvExtractionSchema, CvExtractionResult } from '../cv-extraction.schema1';
import { performance } from 'perf_hooks';

import nlp from 'compromise';

@Injectable()
export class CvParserFacade2 {
  private readonly logger = new Logger(CvParserFacade2.name);
  private readonly llmModel;

  // Semantic threshold below which we reject heuristics and trigger LLM
  private readonly CONFIDENCE_THRESHOLD = 0.8; 

  constructor(
    private readonly heuristicParser: CvHeuristicParserService,
    private readonly ocrService: OcrService,
  ) {
    this.llmModel = new ChatOllama({
      baseUrl: 'http://localhost:11434',
      model: 'qwen2.5:7b',
      temperature: 0.1,
      numCtx: 4096,
      numPredict: 2048,
    }).withStructuredOutput(CvExtractionSchema);
  }

  async parseScannedCv(fileBuffer: Buffer): Promise<any> {
    const globalStartTime = performance.now();
    this.logger.log('⏱️ Starting Dedicated Scanned PDF Parser Pipeline (CvParserFacade2)...');

    // 1. STAGE 1: Always execute local OCR on the PDF buffer
    const ocrStartTime = performance.now();
    const rawText = await this.ocrService.extractTextFromPdf(fileBuffer, 'fra+eng');
    const ocrDurationMs = Math.round(performance.now() - ocrStartTime);

    this.logger.log(`⚙️ OCR extraction complete in ${ocrDurationMs} ms. Running text sanitization...`);

    // 2. STAGE 2: Sanitize page markers, trailing hyphens, and whitespace
    const cleanedText = rawText
      .replace(/-- \d+ of \d+ --/g, '')
      .replace(/([-–])\s*\n\s*/g, '$1 ')
      .replace(/---\s*Page\s*\d+\s*---/gi, '')
      .replace(/Page\s*\d+\s*---/gi, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    // 3. STAGE 3: Segment into raw blocks
    const sections = (this.heuristicParser as any).segmentText(cleanedText);

    // 4. STAGE 4: Fast-Path (Heuristic Parser execution)
    const heuristicStartTime = performance.now();
    const result = this.heuristicParser.parse(cleanedText, 1, 25, 'Scanned_CV.pdf');
    const heuristicDuration = performance.now() - heuristicStartTime;
    this.logger.log(`⚡ Heuristics parsed in ${heuristicDuration.toFixed(2)} ms.`);

    let fallbackTriggered = false;
    let llmInferenceTimeMs = 0;

    // 5. STAGE 5: Run Generalized Confidence-Gated Validation
    
    // --- GENERALIZED QUALITY GATE: EXPERIENCES ---
    const isExperienceInvalid = 
      result.experiences.length === 0 || 
      result.experiences.some((exp: any) => {
        const confidence = this.calculateExperienceConfidence(exp);
        this.logger.log(`📊 Experience confidence score for "${exp.company}": ${confidence.toFixed(2)}`);
        return confidence < this.CONFIDENCE_THRESHOLD;
      });

    if (isExperienceInvalid && sections.experience && sections.experience.trim().length > 50) {
      this.logger.warn('⚠️ Heuristic Experience extraction failed quality gate. Triggering Qwen fallback...');
      this.logger.log(`📝 Raw text passed to the LLM [EXPERIENCES]:\n"""\n${sections.experience}\n"""`);

      const llmStart = performance.now();
      const llmData = await this.runTargetedLlmFallback('experiences', sections.experience);
      if (llmData && llmData.experiences && llmData.experiences.length > 0) {
        result.experiences = llmData.experiences.map((exp: any) => ({
          company: exp.company,
          role: exp.role,
          period: exp.period || null,
          start_date: null,
          end_date: null,
          description: exp.description || exp.role
        }));
        fallbackTriggered = true;
      }
      llmInferenceTimeMs += (performance.now() - llmStart);
    }

    // --- QUALITY GATE: CERTIFICATIONS ---
    const isCertificationInvalid = 
      result.certifications.length === 0 || 
      result.certifications.some((cert: any) => !cert.cert_name || cert.cert_name.trim().length < 5);

    if (isCertificationInvalid && sections.certification && sections.certification.trim().length > 50) {
      this.logger.warn('⚠️ Heuristic Certification extraction failed quality gate. Triggering Qwen fallback...');
      this.logger.log(`📝 Raw text passed to the LLM [CERTIFICATIONS]:\n"""\n${sections.certification}\n"""`);

      const llmStart = performance.now();
      const llmData = await this.runTargetedLlmFallback('certifications', sections.certification);
      if (llmData && llmData.certifications && llmData.certifications.length > 0) {
        result.certifications = llmData.certifications.map((cert: any) => ({
          cert_name: cert.cert_name,
          provider: cert.provider || 'Professional Issuer',
          date: cert.date || null,
          issue_date: null,
          expiry_date: null
        }));
        fallbackTriggered = true;
      }
      llmInferenceTimeMs += (performance.now() - llmStart);
    }

    // --- QUALITY GATE: EDUCATION ---
    const isEducationInvalid = 
      result.education.length === 0 || 
      result.education.some((edu: any) => !edu.institution || !edu.degree || edu.degree.trim().length < 5);

    if (isEducationInvalid && sections.education && sections.education.trim().length > 50) {
      this.logger.warn('⚠️ Heuristic Education extraction failed quality gate. Triggering Qwen fallback...');
      this.logger.log(`📝 Raw text passed to the LLM [EDUCATION]:\n"""\n${sections.education}\n"""`);

      const llmStart = performance.now();
      const llmData = await this.runTargetedLlmFallback('education', sections.education);
      if (llmData && llmData.education && llmData.education.length > 0) {
        result.education = llmData.education.map((edu: any) => ({
          degree: edu.degree,
          institution: edu.institution,
          year: edu.year || null,
          start_year: null,
          end_year: null
        }));
        fallbackTriggered = true;
      }
      llmInferenceTimeMs += (performance.now() - llmStart);
    }

    // --- QUALITY GATE: PROJECTS ---
    const isProjectInvalid = 
      result.projects.length === 0 || 
      result.projects.some((proj: any) => !proj.client || proj.client === 'Inconnu' || !proj.description || proj.description.trim().length < 10);

    if (isProjectInvalid && sections.projects && sections.projects.trim().length > 50) {
      this.logger.warn('⚠️ Heuristic Projects extraction failed quality gate. Triggering Qwen fallback...');
      this.logger.log(`📝 Raw text passed to the LLM [PROJECTS]:\n"""\n${sections.projects}\n"""`);

      const llmStart = performance.now();
      const llmData = await this.runTargetedLlmFallback('projects', sections.projects);
      if (llmData && llmData.projects && llmData.projects.length > 0) {
        result.projects = llmData.projects.map((proj: any) => ({
          name: proj.client,
          client: proj.client,
          role: 'Consultant / Intervenant',
          description: proj.description,
          end_date: null,
          start_date: null,
          year: proj.year || null
        }));
        fallbackTriggered = true;
      }
      llmInferenceTimeMs += (performance.now() - llmStart);
    }

    const totalDurationMs = Math.round(performance.now() - globalStartTime);
    this.logger.log(`⏱️ Dedicated pipeline processed in ${(totalDurationMs / 1000).toFixed(2)} seconds.`);

    return {
      status: 'success',
      execution_metrics: {
        total_time_ms: totalDurationMs,
        ocr_time_ms: ocrDurationMs,
        heuristic_time_ms: Math.round(heuristicDuration),
        llm_inference_ms: Math.round(llmInferenceTimeMs),
        is_scanned_pdf: true,
        fallback_triggered: fallbackTriggered,
        character_count: cleanedText.length
      },
      data: {
        contact: {
          name: result.full_name,
          profession: result.profession,
          phone: result.phone,
          fax: result.fax,
          email: result.email,
          address: result.address,
          skills: result.skills
        },
        experience: result.experiences.map((exp: any) => ({
          period: exp.period || null,
          company: exp.company,
          role: exp.role
        })),
        certifications: result.certifications.map((cert: any) => ({
          certName: cert.cert_name,
          date: cert.date || null
        })),
        education: result.education.map((edu: any) => ({
          year: edu.year || null,
          institution: edu.institution,
          degree: edu.degree
        })),
        projects: result.projects.map((proj: any) => ({
          year: proj.year || null,
          client: proj.client,
          description: proj.description
        }))
      }
    };
  }

  /**
   * GENERALIZED NLP CONFIDENCE SCORE ALGORITHM
   * Calculates a structural and syntactic quality score between 0.0 and 1.0.
   */
  private calculateExperienceConfidence(exp: any): number {
    let score = 1.0;

    const companyWords = exp.company ? exp.company.trim().split(/\s+/) : [];
    const roleWords = exp.role ? exp.role.trim().split(/\s+/) : [];

    if (companyWords.length === 0 || roleWords.length === 0) return 0.0;

    // 1. Structural Check
    if (companyWords.length > 5) score -= 0.3; // Company names are rarely very long
    if (exp.role.trim().length < 5) score -= 0.3; // Role names are rarely very short

    // 2. Syntactic POS Tagging
    const companyDoc = nlp(exp.company);
    if (companyDoc.verbs().length > 0) {
      score -= 0.3; // Active verbs in company name indicates a parsing split error
    }

    const hasPreposition = companyDoc.prepositions().length > 0;
    if (hasPreposition && companyWords.length <= 2) {
      score -= 0.3; // Penalize short prepositional names (e.g. "Chef de")
    }

    // 3. Role-Keyword Swap Detection
    const roleKeywords = ['chef', 'manager', 'engineer', 'ingénieur', 'consultant', 'administrator', 'administrateur', 'technicien', 'developer', 'développeur', 'infrastructure'];
    const containsRoleKeyword = companyWords.some(w => roleKeywords.includes(w.toLowerCase()));
    if (containsRoleKeyword) {
      score -= 0.4; // High penalty if the company name contains typical job-role words
    }

    return Math.max(0, score);
  }

  private async runTargetedLlmFallback(sectionName: string, textBlock: string): Promise<CvExtractionResult | null> {
    const prompt = `
You are an expert CV parsing assistant.
Task: Extract ONLY the ${sectionName.toUpperCase()} details from the provided text block.

Rules:
- Only parse details belonging to the requested section: "${sectionName}".
- Set all other unrelated fields (like full_name, email, address, skills, other sections) to null or empty arrays [].
- Extract ALL items from this specific text without omission.
- Do NOT translate terms. Keep original names and dates as written.
- If a date is missing, set its value strictly to null.

TEXT BLOCK TO PARSE:
---
${textBlock}
---
    `;

    try {
      return (await this.llmModel.invoke(prompt)) as CvExtractionResult;
    } catch (error) {
      this.logger.error(`Local Qwen fallback failed for section ${sectionName}: ${error.message}`);
      return null;
    }
  }
}