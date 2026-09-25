// src/cv-generator/services/cv-generator.service.ts
import { Injectable, Logger, Inject, InternalServerErrorException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CvTemplateService } from './cv-template.service';
import { CvDataFormatterService } from './cv-data-formatter.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { ILlmEngine, LLM_ENGINE } from '../../llm/llm.interface';
import { cvTemplateHtmlSchema } from '../cv-template.schema';
import { FormattedCandidateData } from '../candidate-data.types';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class CvGeneratorService {
  private readonly logger = new Logger(CvGeneratorService.name);
  private readonly generatedOutputDir: string;

  constructor(
    private readonly templateService: CvTemplateService,
    private readonly dataFormatter: CvDataFormatterService,
    private readonly pdfGenerator: PdfGeneratorService,
    @Inject(LLM_ENGINE) private readonly llmEngine: ILlmEngine,
    private readonly configService: ConfigService,
    @InjectQueue('cv-generation') private readonly cvGenerationQueue: Queue,
  ) {
    const configuredPath = this.configService.get<string>('UPLOAD_GENERATED_DESTINATION') || './uploads/generated';
    this.generatedOutputDir = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(process.cwd(), configuredPath);
  }

  async enqueueCvGeneration(templateId: string, userId: number) {
    const job = await this.cvGenerationQueue.add(
      'generate-cv',
      { templateId, userId },
      {
        attempts: 2,
        removeOnComplete: { age: 3600, count: 500 },
        removeOnFail: { age: 86400 },
      },
    );

    return {
      status: 'queued',
      message: 'CV generation started in the background.',
      jobId: job.id,
    };
  }

  async getGenerationJobStatus(jobId: string) {
    const job = await this.cvGenerationQueue.getJob(jobId);
    if (!job) return { jobId, state: 'completed', status: 'completed', progress: 100 };

    const state = await job.getState();
    return {
      jobId: job.id,
      state,
      progress: job.progress,
      result: job.returnvalue || null,
      failedReason: job.failedReason || null,
    };
  }

  async compileSkeleton(skeleton: string, candidate: FormattedCandidateData): Promise<string> {
    this.logger.log(`Compiling skeleton for candidate: ${candidate.full_name}`);
    const prompt = `You are an expert Document Compiler.
You receive:
1. A styled HTML skeleton template containing descriptive brackets (e.g., [Nom Complet], [Date de naissance], and empty table rows like [Date 1], [Description 1]).
2. A raw Candidate JSON dataset.

Your task is to compile the Candidate JSON data directly into the HTML template, intelligently replacing the descriptive brackets with formatted candidate data, and return the completed HTML.

Rules:
1. SEMANTIC MATCHING: Analyze the descriptive brackets and labels inside the HTML skeleton. Map them semantically to the closest matching data inside the Candidate JSON, regardless of the language or exact wording.
2. DYNAMIC TABLE RESOLUTION: 
   - Replicate and expand the HTML table rows or list containers to match the number of items in the candidate's history arrays (experiences, projects, educations, etc.).
   - Map candidate 'experiences' strictly to tables/sections representing standard professional employment history.
   - Map candidate 'projects' strictly to tables/sections representing projects, references, or similar missions. Do NOT mix or duplicate these datasets.
   - Prevent data duplication across adjacent columns. For example, in tables with both "Projet" and "Client" columns, map the detailed 'description' to the project column and the company/client name to the client column.
3. DYNAMIC CALCULATION:
   - "Dernier diplôme" / "Année d'obtention": Inspect the candidate's 'education' array, identify the most recent degree based on the dates, and write it in.
   - "Date de recrutement": Map this dynamically using the start date of the candidate's most recent work experience.
   - "Nombre d'années d'expérience": Calculate the total sum of years of experience based on the candidate's experience periods.
   - "Profil et connaissances": Synthesize a professional, flowing summary paragraph combining the candidate's 'profession' and their 'skills' list.
4. CONDITIONAL OMISSION: If a visual metadata field or row (e.g., birth_date, marital_status) has no value in the Candidate JSON, completely remove that entire line or row from the HTML — do not leave blank spaces or empty brackets.
5. For manual-only fields (Signature, Fonction à assurer): keep the field label, leave the value blank with dotted lines.
6. DATE FORMATTING: Format all raw date strings into clean, human-readable dates matching the language of the template (e.g., "Janvier 2015" for French, "January 2015" for English).
7. Return only the complete HTML. No explanation, no markdown.

HTML SKELETON:
${skeleton}

CANDIDATE DATA:
${JSON.stringify(candidate, null, 2)}`;

    const result = await this.llmEngine.generateStructured<{ html: string }>(
      prompt,
      cvTemplateHtmlSchema,
    );

    this.logger.log(`Stage 2 Compiled HTML Length: ${result?.html?.length || 0} characters`);
    return result.html;
  }

  /**
   * Compiles data and renders the PDF (Executed by BullMQ worker)
   */
   getGeneratedFilePath(fileName: string): string {
    const safeFileName = path.basename(fileName);
    return path.join(this.generatedOutputDir, safeFileName);
  }

  async compileAndRenderPdf(templateId: string, userId: number): Promise<{ downloadUrl: string; fileName: string }> {
    this.logger.log(`Compiling PDF CV for Candidate #${userId} with Template #${templateId}...`);

    try {
      const skeleton = await this.templateService.getSkeleton(templateId);
      const candidateData = await this.dataFormatter.getFormattedCandidateData(userId);
      const populatedHtml = await this.compileSkeleton(skeleton, candidateData);

      // Print HTML directly to PDF with Puppeteer
      const pdfBuffer = await this.pdfGenerator.generate(populatedHtml);

      // Save generated PDF to C:\nextrh_data\uploads\generated
      await fs.mkdir(this.generatedOutputDir, { recursive: true });
      const fileName = `generated-cv-${userId}-${Date.now()}.pdf`;
      const fullDiskPath = path.join(this.generatedOutputDir, fileName);
      await fs.writeFile(fullDiskPath, pdfBuffer);

       return {
        downloadUrl: `http://localhost:3000/cv/download/${fileName}`,
        fileName,
      };
    } catch (err: any) {
      this.logger.error(`CV generation failed: ${err.message}`);
      throw new InternalServerErrorException(`CV generation failed: ${err.message}`);
    }
  }
}