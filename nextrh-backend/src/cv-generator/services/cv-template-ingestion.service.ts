// src/cv-generator/services/cv-template-ingestion.service.ts
import { Injectable, Logger, Inject, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CvTemplate } from '../entities/cv-template.entity';
import { ILlmEngine, LLM_ENGINE, LlmDocumentAttachment } from '../../llm/llm.interface';
import { cvTemplateHtmlSchema } from '../cv-template.schema';
import * as fs from 'fs/promises';

@Injectable()
export class CvTemplateIngestionService {
  private readonly logger = new Logger(CvTemplateIngestionService.name);

  constructor(
    @InjectRepository(CvTemplate)
    private readonly templateRepo: Repository<CvTemplate>,
    @Inject(LLM_ENGINE) private readonly llmEngine: ILlmEngine,
  ) {}

  /**
   * Executes AI Vision layout extraction on the saved PDF and creates the database entity
   */
  async ingestTemplateFromDisk(
    fullDiskPath: string,
    relativePdfPath: string,
    name: string,
    userId: number,
  ): Promise<{ templateId: string; skeleton: string }> {
    this.logger.log(`[AI Ingestion] Analyzing PDF layout for: "${name}"`);

    try {
      const fileBuffer = await fs.readFile(fullDiskPath);

      const attachment: LlmDocumentAttachment = {
        type: 'document',
        mediaType: 'application/pdf',
        data: fileBuffer.toString('base64'),
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

      // Persist in database using TypeORM
      const newTemplate = this.templateRepo.create({
        name,
        template_html: skeleton,
        original_pdf_url: relativePdfPath,
        created_by: userId,
      });

      const saved = await this.templateRepo.save(newTemplate);
      this.logger.log(`[AI Ingestion] Template saved with ID: ${saved.id}`);

      return { templateId: saved.id, skeleton };
    } catch (error: any) {
      // Rollback: remove the file if AI failed
      await fs.unlink(fullDiskPath).catch(() => {});
      this.logger.error(`[AI Ingestion] Failed: ${error.message}`);
      throw new InternalServerErrorException(`Template ingestion failed: ${error.message}`);
    }
  }
}