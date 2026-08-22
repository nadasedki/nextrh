import { Inject, Injectable, Logger } from '@nestjs/common';
import { performance } from 'perf_hooks';
import { ILlmEngine, LLM_ENGINE } from '../llm/llm.interface';
import { CvSchema, CvExtractionResult } from './schema/cv.schema';

export interface ParsedCvResponse {
  status: 'success';
  execution_metrics: {
    total_time_ms: number;
    heuristic_time_ms: number;
    llm_inference_ms: number;
    fallback_triggered: boolean;
    character_count: number;
    parser_mode: 'gemini_multimodal';
  };
  data: {
    profile: {
      name: string | null;
      profession: string | null;
      phone: string | null;
      fax: string | null;
      email: string | null;
      address: string | null;
      skills: string[];
    };
    experience: Array<{
      period: string | null;
      company: string;
      role: string;
      lowConfidence: boolean;
    }>;
    certifications: Array<{
      certName: string;
      provider: string;
      date: string | null;
      issue_date: string | null;
      expiry_date: null;
      lowConfidence: boolean;
    }>;
    education: Array<{
      year: string | null;
      institution: string;
      degree: string;
      lowConfidence: boolean;
    }>;
    projects: Array<{
      year: string | null;
      client: string;
      description: string;
      lowConfidence: boolean;
    }>;
  };
}

@Injectable()
export class CvMultimodalParserService {
  private readonly logger = new Logger(CvMultimodalParserService.name);

  constructor(
    @Inject(LLM_ENGINE) private readonly llmEngine: ILlmEngine,
  ) {}

  async parseCvPdf(fileBuffer: Buffer): Promise<ParsedCvResponse> {
    const globalStart = performance.now();

    // convert PDF buffer to base64 for multimodal input
    const base64Pdf = fileBuffer.toString('base64');

    const prompt = `You are an expert HR data extraction assistant.
Extract all professional information from the attached PDF CV document.

Rules:
- Extract ALL information present in the document without omission.
- Do NOT translate any terms. Keep original names, titles, and dates as written.
- For dates: keep the original format found in the document (e.g. "Février 2020", "2018-2022").
- For missing fields: use null for strings, empty array [] for arrays.
- Skills: extract individual technology and tool names as separate items ONLY from a dedicated, visible skills or competencies section
- For certifications without explicit dates: set date to null.
- Extract all projects with their client names and technical descriptions.

PDF DOCUMENT:
[The attached document contains the CV to parse]`;

    const llmStart = performance.now();

    // multimodal call — PDF sent as base64 document attachment
    const result = await this.llmEngine.generateStructured<CvExtractionResult>(
      prompt,
      CvSchema,
      undefined,
      // pass the base64 PDF as a document attachment
      {
        type:      'document',
        mediaType: 'application/pdf',
        data:      base64Pdf,
      },
    );

    const llmInferenceMs = performance.now() - llmStart;
    const totalMs        = Math.round(performance.now() - globalStart);

    this.logger.log(
      `Gemini multimodal CV parse complete in ${(totalMs / 1000).toFixed(2)}s`,
    );

    return this.mapToResponse(result, totalMs, Math.round(llmInferenceMs), base64Pdf.length);
  }

  // maps LLM output to the exact same response shape as the heuristic parser
  private mapToResponse(
    result: CvExtractionResult,
    totalMs: number,
    llmMs: number,
    charCount: number,
  ): ParsedCvResponse {
    return {
      status: 'success',
      execution_metrics: {
        total_time_ms:    totalMs,
        heuristic_time_ms: 0,          
        llm_inference_ms: llmMs,
        fallback_triggered: false,     
        character_count: charCount,
        parser_mode: 'gemini_multimodal',
      },
      data: {
        profile: {
          name:       result.full_name,
          profession: result.profession,
          phone:      result.phone,
          fax:        result.fax,
          email:      result.email,
          address:    result.address,
          skills:     result.skills ?? [],
        },
        experience: (result.experiences ?? []).map(e => ({
          period:      e.period ?? null,
          company:     e.company,
          role:        e.role,
          lowConfidence: false,
        })),
        certifications: (result.certifications ?? []).map(c => ({
          certName:    c.cert_name,
          provider:    c.provider,
          date:        c.date ?? null,
          issue_date:  c.date ?? null,
          expiry_date: null,
          lowConfidence: false,
        })),
        education: (result.education ?? []).map(e => ({
          year:        e.year ?? null,
          institution: e.institution,
          degree:      e.degree,
          lowConfidence: false,
        })),
        projects: (result.projects ?? []).map(p => ({
          year:        p.year ?? null,
          client:      p.client,
          description: p.description,
          lowConfidence: false,
        })),
      },
    };
  }
}