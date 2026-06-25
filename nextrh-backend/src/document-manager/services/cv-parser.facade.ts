import { Injectable, Logger } from '@nestjs/common';
import { CvHeuristicParserService } from './cv-heuristic-parser.service';
import { PdfParserService } from './pdf-parser.service';
import { ChatOllama } from '@langchain/ollama';
//import { CvExtractionSchema, CvExtractionResult } from '../cv-extraction.schema1';
import { performance } from 'perf_hooks';
import { 
  CvExtractionSchema, 
  CvExtractionResult, // <-- Ton type original
  ExperiencesFallbackSchema, 
  ExperiencesFallbackResult, 
  CertificationsFallbackSchema, 
  CertificationsFallbackResult, 
  EducationFallbackSchema, 
  EducationFallbackResult, 
  ProjectsFallbackSchema,
  ProjectsFallbackResult
} from '../cv-extraction.schema';
@Injectable()
export class CvParserFacade {
  private readonly logger = new Logger(CvParserFacade.name);
  private readonly llmModel;

 constructor(
    private readonly heuristicParser: CvHeuristicParserService,
    private readonly pdfParserService: PdfParserService,
  ) {
    this.llmModel = new ChatOllama({
      baseUrl: 'http://localhost:11434',
      model: 'qwen2.5:3b-instruct-q4_K_M',
      temperature: 0.1,
      numCtx: 4096,      
      numPredict: 2048, 
    });
  }

  async parseCv(fileBuffer: Buffer): Promise<any> {
    const globalStartTime = performance.now();
    this.logger.log(' Starting Hybrid (Heuristic + Quality-Gated LLM Fallback) Parser...');

    // 1. Extract raw text
    const rawText = await this.pdfParserService.extractRawText(fileBuffer);
    const cleanedText = rawText
      .replace(/-- \d+ of \d+ --/g, '')
      .replace(/([-–])\s*\n\s*/g, '$1 ') // Merge split date ranges
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    // 2. Segment into raw blocks
    const sections = (this.heuristicParser as any).segmentText(cleanedText);

    // 3. Fast-Path (Heuristic Parser execution)
    const heuristicStartTime = performance.now();
    const result = this.heuristicParser.parse(cleanedText, 1, 25, 'CV_Buffer.pdf');
    const heuristicDuration = performance.now() - heuristicStartTime;
    this.logger.log(` Heuristic parsed in ${heuristicDuration.toFixed(2)} ms.`);

    let fallbackTriggered = false;
    let llmInferenceTimeMs = 0;

    // 4. Run Quality-Gates validation before accepting heuristic data
    
    // --- QUALITY GATE: EXPERIENCES ---
    const isExperienceInvalid = 
      result.experiences.length === 0 || 
      result.experiences.some((exp: any) => !exp.company || exp.company === 'Inconnu' || !exp.role || exp.role.trim().length < 3);

    if (isExperienceInvalid && sections.experience && sections.experience.trim().length > 50) {
      this.logger.warn(' Heuristic Experience failed quality gate. Triggering Qwen fallback...');
       this.logger.log(` Raw text passed to the LLM [EXPERIENCES]:\n"""\n${sections.experience}\n"""`);

      const llmStart = performance.now();
      const llmData = await this.runTargetedLlmFallback('experiences', sections.experience);
      if (llmData && llmData.experiences && llmData.experiences.length > 0) {
        result.experiences = llmData.experiences.map((exp: any) => ({
          company: exp.company,
          role: exp.role,
          period: exp.period || 'Date à préciser',
          start_date: null,
          end_date: null,
          description: exp.description || exp.role
        }));
        fallbackTriggered = true;
      }
      llmInferenceTimeMs += (performance.now() - llmStart);
    }
// --- QUALITY GATE: CERTIFICATIONS (Version Adaptée sans dépendance aux dates) ---
// --- QUALITY GATE: CERTIFICATIONS (GÉNÉRIQUE) ---
const isCertificationInvalid = 
  result.certifications.length === 0 || 
  result.certifications.some((cert: any) => {
    const name = (cert.cert_name || cert.certName || '').trim();
    
    // 1. Protection contre le vide
    if (name.length < 3) return true;

    // 2. Détection de pavé (Longueur absolue)
    // Un nom de certification (même long) dépasse rarement 120 caractères.
    const isTooLong = name.length > 120;

    // 3. Détection de fusion par le compte de mots
    // "CCNP Security" = 2 mots. Le pavé Dell/HP en comptait plus de 80.
    const wordCount = name.split(/\s+/).length;
    const hasTooManyWords = wordCount > 15; // Au-delà de 15 mots, ce n'est plus un titre, c'est une phrase/paragraphe.

    // 4. Détection de listes à puces ou séparateurs cachés dans la string
    // Si l'heuristique a avalé des caractères de séparation (ex: puces, tirets multiples, double-points répétés)
    const punctuationCount = (name.match(/[:\-\-|•●▪]/g) || []).length;
    const hasTooManySeparators = punctuationCount > 2;

    return isTooLong || hasTooManyWords || hasTooManySeparators;
  });
    if (isCertificationInvalid && sections.certification && sections.certification.trim().length > 50) {
      this.logger.warn(' Heuristic Certification failed quality gate. Triggering Qwen fallback...');
        this.logger.log(` Raw text passed to the LLM [CERTIFICATIONS]:\n"""\n${sections.certification}\n"""`);
      const llmStart = performance.now();
      const llmData = await this.runTargetedLlmFallback('certifications', sections.certification);
      if (llmData && llmData.certifications && llmData.certifications.length > 0) {
        result.certifications = llmData.certifications.map((cert: any) => ({
          cert_name: cert.cert_name,
          provider: cert.provider || 'Professional Issuer',
          date: cert.date || 'Date à préciser',
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
      this.logger.warn(' Heuristic Education failed quality gate. Triggering Qwen fallback...');
       this.logger.log(` Raw text passed to the LLM [EDUCATION]:\n"""\n${sections.education}\n"""`);
      const llmStart = performance.now();
      const llmData = await this.runTargetedLlmFallback('education', sections.education);
      if (llmData && llmData.education && llmData.education.length > 0) {
        result.education = llmData.education.map((edu: any) => ({
          degree: edu.degree,
          institution: edu.institution,
          year: edu.year || 'Date à préciser',
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
      this.logger.warn(' Heuristic Projects failed quality gate. Triggering Qwen fallback...');
       this.logger.log(` Raw text passed to the LLM [PROJECTS]:\n"""\n${sections.projects}\n"""`);

      const llmStart = performance.now();
      const llmData = await this.runTargetedLlmFallback('projects', sections.projects);
      if (llmData && llmData.projects && llmData.projects.length > 0) {
        result.projects = llmData.projects.map((proj: any) => ({
          name: proj.client,
          client: proj.client,
          role: 'N/A',
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
    this.logger.log(` Hybrid pipeline processed in ${(totalDurationMs / 1000).toFixed(2)} seconds.`);

    return {
      status: 'success',
      execution_metrics: {
        total_time_ms: totalDurationMs,
        heuristic_time_ms: Math.round(heuristicDuration),
        llm_inference_ms: Math.round(llmInferenceTimeMs),
        fallback_triggered: fallbackTriggered,
        character_count: cleanedText.length
      },
      data: {
        profile: {
          name: result.full_name,
          profession: result.profession,
          phone: result.phone,
          fax: result.fax,
          email: result.email,
          address: result.address,
          skills: result.skills
        },
        experience: result.experiences.map((exp: any) => ({
          period: exp.period || 'Date à préciser',
          company: exp.company,
          role: exp.role
        })),
        certifications: result.certifications.map((cert: any) => ({
          certName: cert.cert_name,
          date: cert.date || 'Date à préciser'
        })),
        education: result.education.map((edu: any) => ({
          year: edu.year,
          institution: edu.institution,
          degree: edu.degree
        })),
        projects: result.projects.map((proj: any) => ({
          year: proj.year,
          client: proj.client,
          description: proj.description
        }))
      }
    };
  }

private async runTargetedLlmFallback(sectionName: string, textBlock: string): Promise<any> {
    let targetSchema: any;

    // Sélection dynamique du mini-schéma
    if (sectionName === 'certifications') targetSchema = CertificationsFallbackSchema;
    else if (sectionName === 'projects') targetSchema = ProjectsFallbackSchema;
    else if (sectionName === 'experiences') targetSchema = ExperiencesFallbackSchema;
    else if (sectionName === 'education') targetSchema = EducationFallbackSchema;
    else targetSchema = CvExtractionSchema;

    const prompt = `
You are an expert CV parsing assistant.
Task: Extract ONLY the ${sectionName.toUpperCase()} details from the provided text block.

Rules:
- Only parse details belonging to the requested section: "${sectionName}".
- Extract ALL items from this specific text without omission.
- Do NOT translate terms. Keep original names and dates as written.

TEXT BLOCK TO PARSE:
---
${textBlock}
---`;

    try {
      // On lie le mini-schéma à la volée sur l'instance légère du modèle
      const modelWithStructure = this.llmModel.withStructuredOutput(targetSchema);
      const response = await modelWithStructure.invoke(prompt);
      
      // ✅ Transtypage forcé demandé pour la compilation stricte de ton architecture
      return response ;
    } catch (error) {
      this.logger.error(`Local Qwen fallback failed for section ${sectionName}: ${error.message}`);
      return null;
    }
  }
}