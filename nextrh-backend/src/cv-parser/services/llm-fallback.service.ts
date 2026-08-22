import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOllama } from '@langchain/ollama';
import { ILlmEngine, LLM_ENGINE } from '../../llm/llm.interface';
import {
  CvSchema,
  ExperiencesFallbackSchema,
  CertificationsFallbackSchema,
  EducationFallbackSchema,
  ProjectsFallbackSchema,
} from '../schema/cv.schema';

const schemaMap: Record<string, any> = {
      certifications: CertificationsFallbackSchema,
      projects: ProjectsFallbackSchema,
      experiences: ExperiencesFallbackSchema,
      education: EducationFallbackSchema,
    };

@Injectable()
export class LlmFallbackService {
  private readonly logger = new Logger(LlmFallbackService.name);
  private readonly llmModel: ChatOllama;

constructor(
    @Inject(LLM_ENGINE) private readonly llmEngine: ILlmEngine,
  ) {}

  public async runFallback<T>(sectionKey: string, textBlock: string): Promise<T[] | null> {
    
    const schema = schemaMap[sectionKey] ?? CvSchema;

    const prompt = `You are an expert CV parsing assistant.
Task: Extract ONLY the ${sectionKey.toUpperCase()} details from the text block below.

Rules:
- Extract ONLY details belonging to the "${sectionKey}" section.
- Extract ALL items without omission.
- Do NOT translate terms. Keep original names and dates as written.
- For certification dates: if no explicit date exists, set "date" to null.

TEXT BLOCK:
---
${textBlock}
---`;

    try {
    const response = await this.llmEngine.generateStructured<Record<string, T[]>>(
        prompt,
        schema,
      ); return (response as any)?.[sectionKey] ?? null;
    } catch (err: any) {
      this.logger.error(`LLM fallback failed for section "${sectionKey}": ${err.message}`);
      return null;
    }
  }
}