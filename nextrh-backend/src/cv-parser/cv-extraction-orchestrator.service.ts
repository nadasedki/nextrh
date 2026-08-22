import { Injectable, Logger } from '@nestjs/common';
import { performance } from 'perf_hooks';
import { PdfParserService } from './services/pdf-parser.service';
import { TextSegmentationService } from './services/text-segmentation.service';
import { CvHeuristicextractionService } from './cv-heuristic-extraction.service';
import { LlmFallbackService } from './services/llm-fallback.service';
import { CertificationExtractorService } from './services/certification-extractor.service';
import { EducationExtractorService } from './services/education-extractor.service';
import { ProjectExtractorService } from './services/project-extractor.service';
import { ExperienceExtractorService } from './services/experience-extractor.service';
import { cleanRawText } from './utils/text-cleaning.util';
import { ParsedCvResponse, SectionResult } from './interfaces/cv-extraction.types';

@Injectable()
export class CvExtractionOrchestrator {
  private readonly logger = new Logger(CvExtractionOrchestrator.name);

  constructor(
    private readonly pdfParser: PdfParserService,
    private readonly segmenter: TextSegmentationService,
    private readonly heuristicextraction: CvHeuristicextractionService,
    private readonly llmFallback: LlmFallbackService,
    private readonly certExtractor: CertificationExtractorService,
    private readonly eduExtractor: EducationExtractorService,
    private readonly projExtractor: ProjectExtractorService,
    private readonly expExtractor: ExperienceExtractorService,
  ) {}

  public async parseCv(fileBuffer: Buffer): Promise<ParsedCvResponse> {
    const start = performance.now();
    this.logger.log('Starting Hybrid CV parsing execution (Heuristic + Targeted LLM Parallel Fallbacks)...');

    // 1. Text extraction and preprocessing (Single clean pass)
    const rawText = await this.pdfParser.extractRawText(fileBuffer);
    const cleaned = cleanRawText(rawText);

    // 2. Segment text
    const sections = this.segmenter.segmentText(cleaned);

    // 3. Fast Heuristic extraction
    const hStart = performance.now();
    const result = this.heuristicextraction.parse(cleaned);
    const hDurationMs = performance.now() - hStart;

    let fallbackTriggered = false;
    let llmInferenceMs = 0;

    // Default Section Result Envelopes
    const experiences: SectionResult<any> = { data: result.experiences, source: 'heuristic', lowConfidence: false };
    const certifications: SectionResult<any> = { data: result.certifications, source: 'heuristic', lowConfidence: false };
    const education: SectionResult<any> = { data: result.education, source: 'heuristic', lowConfidence: false };
    const projects: SectionResult<any> = { data: result.projects, source: 'heuristic', lowConfidence: false };

    // 4. Parallel Validation and Fallbacks queue
    const fallbackPromises: Promise<void>[] = [];
    const llmStart = performance.now();

    // Gate: Experiences
    if (!this.expExtractor.isValid(result.experiences) && (sections.experience ?? '').trim().length > 50) {
      fallbackPromises.push((async () => {
        this.logger.warn('Experience quality check failed — dispatching LLM fallback');
        const llmData = await this.llmFallback.runFallback<any>('experiences', sections.experience);
        if (llmData && llmData.length > 0) {
          experiences.data = llmData.map((e: any) => ({
            company: e.company,
            role: e.role,
            period: e.period ?? 'N/A',
            start_date: null,
            end_date: null,
            description: e.description ?? e.role,
          }));
          experiences.source = 'llm';
          fallbackTriggered = true;
        } else {
          experiences.lowConfidence = true;
        }
      })());
    }

    // Gate: Certifications
    if (!this.certExtractor.isValid(result.certifications) && (sections.certification ?? '').trim().length > 50) {
      fallbackPromises.push((async () => {
        this.logger.warn('Certification quality check failed — dispatching LLM fallback');
        const llmData = await this.llmFallback.runFallback<any>('certifications', sections.certification);
        if (llmData && llmData.length > 0) {
          certifications.data = llmData.map((c: any) => ({
            cert_name: c.cert_name,
            provider: c.provider ?? 'Professional Issuer',
            date: c.date ?? null,
            issue_date: null,
            expiry_date: null,
          }));
          certifications.source = 'llm';
          fallbackTriggered = true;
        } else {
          certifications.lowConfidence = true;
        }
      })());
    }

    // Gate: Education
    if (!this.eduExtractor.isValid(result.education) && (sections.education ?? '').trim().length > 50) {
      fallbackPromises.push((async () => {
        this.logger.warn('Education quality check failed — dispatching LLM fallback');
        const llmData = await this.llmFallback.runFallback<any>('education', sections.education);
        if (llmData && llmData.length > 0) {
          education.data = llmData.map((e: any) => ({
            degree: e.degree,
            institution: e.institution,
            year: e.year ?? 'N/A',
            start_year: null,
            end_year: null,
          }));
          education.source = 'llm';
          fallbackTriggered = true;
        } else {
          education.lowConfidence = true;
        }
      })());
    }

    // Gate: Projects
    if (!this.projExtractor.isValid(result.projects) && (sections.projects ?? '').trim().length > 50) {
      fallbackPromises.push((async () => {
        this.logger.warn('Projects quality check failed — dispatching LLM fallback');
        const llmData = await this.llmFallback.runFallback<any>('projects', sections.projects);
        if (llmData && llmData.length > 0) {
          projects.data = llmData.map((p: any) => ({
            name: p.client,
            client: p.client,
            role: 'N/A',
            description: p.description,
            start_date: null,
            end_date: null,
            year: p.year ?? null,
          }));
          projects.source = 'llm';
          fallbackTriggered = true;
        } else {
          projects.lowConfidence = true;
        }
      })());
    }

    // Resolve any triggers in parallel
    if (fallbackPromises.length > 0) {
      await Promise.all(fallbackPromises);
      llmInferenceMs = performance.now() - llmStart;
    }

    const totalTimeMs = Math.round(performance.now() - start);
    this.logger.log(
      `Hybrid pipeline successfully completed in ${(totalTimeMs / 1000).toFixed(2)}s ` +
      `(heuristics: ${Math.round(hDurationMs)}ms, llm: ${Math.round(llmInferenceMs)}ms, ` +
      `fallback: ${fallbackTriggered})`
    );

    return {
      status: 'success',
      execution_metrics: {
        total_time_ms: totalTimeMs,
        heuristic_time_ms: Math.round(hDurationMs),
        llm_inference_ms: Math.round(llmInferenceMs),
        fallback_triggered: fallbackTriggered,
        character_count: cleaned.length,
      },
      data: {
        profile: {
          name: result.full_name,
          profession: result.profession,
          phone: result.phone,
          fax: result.fax,
          email: result.email,
          address: result.address,
          skills: result.skills,
        },
        experience: experiences.data.map((e: any) => ({
          period: e.period,
          company: e.company,
          role: e.role,
          lowConfidence: experiences.lowConfidence,
        })),
        certifications: certifications.data.map((c: any) => ({
          certName: c.cert_name,
          provider: c.provider,
          date: c.date ?? null,
          issue_date: c.issue_date ?? null,
          expiry_date: c.expiry_date ?? null,
          lowConfidence: certifications.lowConfidence,
        })),
        education: education.data.map((e: any) => ({
          year: e.year,
          institution: e.institution,
          degree: e.degree,
          lowConfidence: education.lowConfidence,
        })),
        projects: projects.data.map((p: any) => ({
          year: p.year ?? null,
          client: p.client,
          description: p.description,
          lowConfidence: projects.lowConfidence,
        })),
      },
    };
  }
}