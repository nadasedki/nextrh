import { 
  Controller, 
  Post, 
  UploadedFile, 
  UseInterceptors, 
  BadRequestException, 
  InternalServerErrorException, 
  Logger 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from '../services/ocr.service';
import { CvHeuristicParserService } from '../services/cv-heuristic-parser.service';
import { Express } from 'express';
import { performance } from 'perf_hooks';
import { CvParserFacade2 } from '../services/cv-parser.facade2';
@Controller('ocr')
export class OcrController {
  private readonly logger = new Logger(OcrController.name);

  constructor(
    private readonly ocrService: OcrService,
    private readonly heuristicParser: CvHeuristicParserService, // Inject the heuristic parser
    private readonly cvParserFacade: CvParserFacade2 // Inject the hybrid parser facade
  ) {}

  /**
   * Endpoint 1: Extracts only the raw text from a scanned PDF (Your previous test endpoint)
   */
  @Post('extract-pdf')
  @UseInterceptors(FileInterceptor('file'))
  async extractTextFromPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni.');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Seuls les fichiers au format PDF sont acceptés.');
    }

    try {
      const startTime = performance.now();
      const extractedText = await this.ocrService.extractTextFromPdf(file.buffer, 'fra+eng');
      const durationMs = Math.round(performance.now() - startTime);

      return {
        status: 'success',
        metadata: {
          filename: file.originalname,
          mimetype: file.mimetype,
          size_bytes: file.size,
          execution_time_ms: durationMs,
          character_count: extractedText.length
        },
        extracted_text: extractedText,
      };
    } catch (error) {
      throw new InternalServerErrorException(`OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Endpoint 2: NEW - Extracts text from scanned PDF and sends it directly to the parsing pipeline
   */
  @Post('parse-scanned2')
  @UseInterceptors(FileInterceptor('file'))
  async parseScannedPdf2(@UploadedFile() file: Express.Multer.File) {
    // 1. Guard Clauses: Validate file presence and format
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni. Veuillez téléverser un fichier PDF scanné.');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Type de fichier invalide. Seuls les fichiers PDF sont acceptés.');
    }

    try {
      this.logger.log(`⚙️ Starting scanned PDF OCR + parsing pipeline for: ${file.originalname}`);
      const startTime = performance.now();

      // 2. STAGE 1: Convert PDF to images and extract raw text via local OCR
      const ocrStartTime = performance.now();
      const extractedText = await this.ocrService.extractTextFromPdf(file.buffer, 'fra+eng');
      const ocrDurationMs = Math.round(performance.now() - ocrStartTime);

      this.logger.log(`⚙️ OCR extraction complete. Character count: ${extractedText.length}. Starting parsing pipeline...`);

      // 3. STAGE 2: Send the extracted text directly to the heuristic parsing service
      const parsingStartTime = performance.now();
      const parsedData = this.heuristicParser.parse(extractedText, 1, 25, file.originalname);
      const parsingDurationMs = Math.round(performance.now() - parsingStartTime);

      const totalDurationMs = Math.round(performance.now() - startTime);
      this.logger.log(`⏱️ Scanned PDF OCR and parsing pipeline completed in ${(totalDurationMs / 1000).toFixed(2)}s.`);

      // 4. Return unified JSON payload
      return {
        status: 'success',
        execution_metrics: {
          total_time_ms: totalDurationMs,
          ocr_extraction_time_ms: ocrDurationMs,
          heuristic_parsing_time_ms: parsingDurationMs,
          character_count: extractedText.length
        },
        data: {
          contact: {
            name: parsedData.full_name,
            profession: parsedData.profession,
            phone: parsedData.phone,
            fax: parsedData.fax,
            email: parsedData.email,
            address: parsedData.address,
            skills: parsedData.skills
          },
          experience: parsedData.experiences.map((exp: any) => ({
            period: exp.period || null,
            company: exp.company,
            role: exp.role
          })),
          certifications: parsedData.certifications.map((cert: any) => ({
            certName: cert.cert_name,
            date: cert.date || null
          })),
          education: parsedData.education.map((edu: any) => ({
            year: edu.year || null,
            institution: edu.institution,
            degree: edu.degree
          })),
          projects: parsedData.projects.map((proj: any) => ({
            year: proj.year || null,
            client: proj.client,
            description: proj.description
          }))
        }
      };
    } catch (error) {
      this.logger.error(`Scanned PDF parsing failed: ${error.message}`);
      throw new InternalServerErrorException(
        `Une erreur est survenue lors de l'analyse OCR et du parsing du PDF : ${error.message}`
      );
    }
  }
  /**
   * Endpoint 2: Runs the entire Quality-Gated Hybrid Pipeline for Scanned PDFs
   */
  @Post('parse-scanned')
  @UseInterceptors(FileInterceptor('file'))
  async parseScannedPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni. Veuillez téléverser un fichier PDF.');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Seuls les fichiers au format PDF sont acceptés.');
    }

    try {
      this.logger.log(`⚙️ Routing scanned PDF to the Hybrid Facade: ${file.originalname}`);

      // 3. Delegate to the Hybrid Facade
      // This will automatically detect it's scanned, run OCR, run heuristics,
      // and trigger local Qwen fallbacks on any failed sections.
      const result = await this.cvParserFacade.parseScannedCv(file.buffer);

      return result;
    } catch (error) {
      this.logger.error(`Scanned PDF hybrid parsing failed: ${error.message}`);
      throw new InternalServerErrorException(
        `Une erreur est survenue lors de l'analyse hybride OCR/LLM : ${error.message}`
      );
    }
  }
}