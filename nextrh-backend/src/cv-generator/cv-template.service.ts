// src/cv-generator/cv-template.service.ts

import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ILlmEngine, LLM_ENGINE, LlmDocumentAttachment } from '../llm/llm.interface';
import { cvTemplateHtmlSchema } from './cv-template.schema';

import { FormattedCandidateData } from './candidate-data.types';

@Injectable()
export class CvTemplateService {
  private readonly logger = new Logger(CvTemplateService.name);

  constructor(
    @Inject(LLM_ENGINE) private readonly llmEngine: ILlmEngine,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  // CALL 1 — runs once per template upload
  // extracts visual structure into a reusable HTML skeleton with Handlebars placeholders
  async extractSkeleton(fileBuffer: Buffer, name: string, userId: number): Promise<{ templateId: number; skeleton: string }> {
    this.logger.log(`Extracting skeleton from template: ${name}`);

    const attachment: LlmDocumentAttachment = {
      type:      'document',
      mediaType: 'application/pdf',
      data:      fileBuffer.toString('base64'),
    };

  const prompt = `You are an expert Senior Document Integration Engineer.
Analyze the exact visual layout, color scheme, spacing, borders, and margins of the attached CV template PDF.
Reconstruct this design into a clean, responsive HTML/CSS skeleton template.

Rules:
1. Use Flexbox or CSS Grid. Do NOT use absolute positioning or fixed heights.
2. Embed all CSS in a <style> block. Include page-break-inside: avoid on repeated blocks and table rows.
3. For all content fields, use clear, descriptive brackets to represent where data belongs (e.g., [Nom Complet], [Poste], [Date de naissance], [Situation familiale], [Date de recrutement], [Nombre d'années d'expérience], [Dernier diplôme], [Année d'obtention], [Profil et connaissances]).
4. For list-based or tabular sections (like experiences, projects, educations, or certifications), generate a semantic HTML structure or table. Render 2 or 3 empty skeleton rows containing descriptive brackets (e.g., [Date 1], [Rôle 1], [Entreprise 1], [Description 1]) to visually demonstrate how list items repeat and align.
5. If a field is visually meant for manual-entry, signature, or a mission role (e.g. "Signature", "Fonction à assurer dans la mission"), preserve the labels but leave their value areas blank with dotted lines (e.g., "..............").
6. Return ONLY the HTML skeleton. No explanation, no markdown.`;

    const result = await this.llmEngine.generateStructured<{ html: string }>(
      prompt,
      cvTemplateHtmlSchema,
      {},
      attachment,
    );

    const skeleton = result.html;

    // save skeleton to DB — reused for all future generation calls
    const inserted = await this.dataSource.query(`
      INSERT INTO public.cv_templates (name, template_html, created_by)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [name, skeleton, userId]);

    const templateId = inserted[0]?.id;
    this.logger.log(`Skeleton saved as template #${templateId}`);

    return { templateId, skeleton };
  }

// Around line 56, change 'number' to 'string':
  async getSkeleton(templateId: string): Promise<string> {
    const rows = await this.dataSource.query(`
      SELECT template_html FROM public.cv_templates WHERE id = $1 LIMIT 1
    `, [templateId]);

    if (!rows.length) {
      throw new NotFoundException(`Template #${templateId} not found.`);
    }
    return rows[0].template_html;
  }

  // CALL 2 — runs per candidate generation (text only — no PDF attachment)
  // fills the skeleton with formatted candidate data intelligently
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
// ADD THESE TWO DIAGNOSTIC LOGS:
  this.logger.log(`Stage 2 Compiled HTML Length: ${result?.html?.length || 0} characters`);
  console.log("GENERATED HTML CONTENT:\n", result.html);

    return result.html;
  }


  /**
   * Retrieves all saved CV templates from the database [2]
   */

  async findAll(): Promise<any[]> {
    this.logger.log('Fetching list of stored CV templates from database');
    try {
      return await this.dataSource.query(`
        SELECT id, name, template_html, created_at -- Added template_html [1.1.2, 2]
        FROM public.cv_templates 
        ORDER BY created_at DESC
      `);
    } catch (err: any) {
      this.logger.error(`Failed to fetch templates from DB: ${err.message}`);
      throw err;
    }
  }
}