import { Injectable, Logger } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { CvExtractionSchema, CvExtractionResult } from '../cv-extraction.schema1';
import { normalizeSkills ,normalizeSkillName} from '../utils/skills.utils';
import { PDFParse } from 'pdf-parse';
import { performance } from 'perf_hooks'; // Node.js native high-resolution timing module


@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);
  private readonly model;
  private readonly MAX_SINGLE_PASS_LENGTH = 12000; 

constructor() {}
   /* this.model = new ChatOllama({
      baseUrl: 'http://localhost:11434',
          //model: 'qwen2.5:7b',
      model: 'qwen2.5:3b-instruct-q4_K_M', 
      temperature: 0.1,
      numCtx: 8192,
      numPredict: 4096,
    }).withStructuredOutput(CvExtractionSchema);
  }

  async parseAndStructure(fileBuffer: Buffer): Promise<any> {
    const globalStartTime = performance.now();
    this.logger.log('📄 Starting raw text extraction...');
    
    let rawText = '';
    let pdfExtractionTimeMs = 0;
    const pdfStartTime = performance.now();

    try {
      const parser = new PDFParse({ data: fileBuffer });
      const result = await parser.getText();
      rawText = result.text;
      await parser.destroy();
      
      // FIX: Capture the exact PDF extraction time immediately
      pdfExtractionTimeMs = Math.round(performance.now() - pdfStartTime);
      this.logger.log(`📄 PDF text extraction completed in ${pdfExtractionTimeMs} ms.`);
    } catch (parseError) {
      this.logger.error(`Error reading binary PDF stream: ${parseError.message}`);
      throw new Error(`Failed to read PDF file: ${parseError.message}`);
    }

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('Extracted text stream is empty or corrupt.');
    }

    const cleanedRawText = rawText
      .replace(/ {2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const finalData = {
      full_name: null as string | null,
      profession: null as string | null,
      phone: null as string | null,
      fax: null as string | null,
      email: null as string | null,
      address: null as string | null,
      skills: [] as string[],
      experiences: [] as any[],
      certifications: [] as any[],
      education: [] as any[],
      projects: [] as any[]
    };

    let inferenceTimeMs = 0;
    const llmStartTime = performance.now();

    if (cleanedRawText.length <= this.MAX_SINGLE_PASS_LENGTH) {
      this.logger.log(`⚡ Short/Standard CV detected (${cleanedRawText.length} chars). Running single-pass extraction.`);
      const prompt = this.generatePrompt(cleanedRawText, 1, 1);
      
      try {
        const aiData = (await this.model.invoke(prompt)) as CvExtractionResult;
        this.mergeData(finalData, aiData);
      } catch (error) {
        this.logger.error(`Single-pass extraction failed: ${error.message}`);
        throw new Error(`AI Extraction failed: ${error.message}`);
      }
    } else {
      const textChunks = this.splitTextIntoChunks(cleanedRawText, 4000);
      this.logger.log(`✂️ Large CV detected (${cleanedRawText.length} chars). Segmented into ${textChunks.length} chunks.`);

      for (let i = 0; i < textChunks.length; i++) {
        this.logger.log(`🤖 Processing chunk ${i + 1}/${textChunks.length}...`);
        const prompt = this.generatePrompt(textChunks[i], i + 1, textChunks.length);

        try {
          const aiData = (await this.model.invoke(prompt)) as CvExtractionResult;
          this.mergeData(finalData, aiData);
        } catch (error) {
          this.logger.warn(`⚠️ Warning: Chunk ${i + 1} failed schema validation. Skipping chunk.`);
        }
      }
    }

    inferenceTimeMs = Math.round(performance.now() - llmStartTime);
    this.logger.log(`🤖 Ollama model inference completed in ${(inferenceTimeMs / 1000).toFixed(2)}s.`);

    const uniqueSkills = Array.from(new Set(finalData.skills));
    const cleanedSkills = normalizeSkills(uniqueSkills).map(normalizeSkillName);

    const uniqueExperiences = this.deduplicateArray(finalData.experiences, exp => `${exp.company}_${exp.role}`);
    const uniqueCertifications = this.deduplicateArray(finalData.certifications, cert => cert.cert_name);
    const uniqueEducation = this.deduplicateArray(finalData.education, edu => `${edu.institution}_${edu.degree}`);
    const uniqueProjects = this.deduplicateArray(finalData.projects, proj => `${proj.client}_${proj.description.substring(0, 30)}`);

    const totalDurationMs = Math.round(performance.now() - globalStartTime);
    this.logger.log(`⏱️ Parsing pipeline executed successfully in ${(totalDurationMs / 1000).toFixed(2)}s.`);

    return {
      status: 'success',
      execution_metrics: {
        total_time_ms: totalDurationMs,
        pdf_extraction_ms: pdfExtractionTimeMs, // Corrected value
        llm_inference_ms: inferenceTimeMs,
        character_count: cleanedRawText.length
      },
      data: {
        contact: {
          name: finalData.full_name,
          profession: finalData.profession,
          phone: finalData.phone,
          fax: finalData.fax,
          email: finalData.email,
          address: finalData.address,
          skills: cleanedSkills
        },
        experience: uniqueExperiences.map(exp => ({
          period: exp.period || 'Date à préciser',
          company: exp.company,
          role: exp.role
        })),
        certifications: uniqueCertifications.map(cert => ({
          certName: cert.cert_name,
          date: cert.date || 'Date à préciser'
        })),
        education: uniqueEducation,
        projects: uniqueProjects
      }
    };
  }

  private generatePrompt(text: string, currentPart: number, totalParts: number): string {
    return `
You are an expert CV parser.
Task: Extract structured information from this specific chunk (Part ${currentPart}/${totalParts}) of the CV text.

Rules:
- Extract ALL relevant information present in this specific text without omission.
- Skills must include technologies found in this specific text from: skills section, certifications, experience, or projects.
- A skill must be a single technology or tool (prefer atomic skills like Java, OSPF, Linux).
- Do NOT translate technical terms or titles. Keep original names and dates as written.
- If a value is unknown, set it to null. If a list is empty, return an empty array []. Do not invent or assume data.

CV CHUNK TEXT:
---
${text}
---
    `;
  }

  private mergeData(target: any, source: CvExtractionResult) {
    if (source.full_name && !target.full_name) target.full_name = source.full_name;
    if (source.profession && !target.profession) target.profession = source.profession;
    if (source.phone && !target.phone) target.phone = source.phone;
    if (source.fax && !target.fax) target.fax = source.fax;
    if (source.email && !target.email) target.email = source.email;
    if (source.address && !target.address) target.address = source.address;

    if (source.skills) target.skills.push(...source.skills);
    if (source.experiences) target.experiences.push(...source.experiences);
    if (source.certifications) target.certifications.push(...source.certifications);
    if (source.education) target.education.push(...source.education);
    if (source.projects) target.projects.push(...source.projects);
  }

  private deduplicateArray<T>(array: T[], keyGenerator: (item: T) => string): T[] {
    if (!array) return [];
    const seen = new Set<string>();
    return array.filter(item => {
      const key = keyGenerator(item).toLowerCase().replace(/\s+/g, '');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private splitTextIntoChunks(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let currentIndex = 0;

    while (currentIndex < text.length) {
      let chunk = text.substring(currentIndex, currentIndex + maxLength);
      if (currentIndex + maxLength < text.length) {
        const lastSpace = chunk.lastIndexOf('\n') !== -1 ? chunk.lastIndexOf('\n') : chunk.lastIndexOf(' ');
        if (lastSpace > 0) {
          chunk = chunk.substring(0, lastSpace);
        }
      }
      chunks.push(chunk.trim());
      currentIndex += chunk.length;
    }
    return chunks;
  }*/

  async extractRawText(fileBuffer: Buffer): Promise<string> {
    this.logger.log('📄 Extracting raw PDF text string...');
    const parser = new PDFParse({ data: fileBuffer });
    try {
      const result = await parser.getText();
      const rawText = result.text;
      this.logger.log(`RAW TEXT:\n${rawText}`);
      return rawText;
    } finally {
      await parser.destroy();
    }
  }
}