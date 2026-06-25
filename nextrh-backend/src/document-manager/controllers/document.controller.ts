import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Logger, InternalServerErrorException, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CvParserFacade } from '../services/cv-parser.facade';
import { CvEvaluationService } from '../services/cv-evaluation.service';
import { PdfParserService } from '../services/pdf-parser.service';
import { CvHeuristicParserService } from '../services/cv-heuristic-parser.service';
@Controller('documents')
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);


  constructor(
    private readonly cvParserFacade: CvParserFacade,
    private readonly cvEvaluationService: CvEvaluationService,
    private readonly pdfParserService: PdfParserService,
    private readonly cvHeuristicParserService: CvHeuristicParserService,
  ) {}
/*
  @Post('upload-test')
  @UseInterceptors(FileInterceptor('file'))
  async testUploadAndParsing(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier n\'a été détecté dans le body.');
    }
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Le format du fichier doit être un PDF uniquement.');
    }

    try {
      const mockMeta = {
        cv_id: 42,
        user_id: 13,
        file_path: `C:\\Users\\sedki\\Desktop\\NextRH\\nextrh-backend\\uploads\\${file.originalname}`
      };

      return await this.pdfParserService.parseAndStructure(file.buffer);
    } catch (error) {
      this.logger.error(`Erreur d'extraction : ${error.message}`);
      throw new BadRequestException(`Échec du parsing structurel : ${error.message}`);
    }
  }
*/

@Post('test-pdf')
  @UseInterceptors(FileInterceptor('file'))
  async testPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      // Academic best practice: Use NestJS built-in HTTP exceptions
      throw new BadRequestException('No file uploaded'); 
    }

    // 1. Extract raw text from the file buffer
    const rawText = await this.pdfParserService.extractRawText(file.buffer);

    // 2. Call the parser using correct positional arguments
    return this.cvHeuristicParserService.parse(
      rawText,
      1,                  // cvId
      25,                 // userId
      file.originalname,  // filePath (or file.path if saved to disk storage)
    );
  }

  @Post('parse')
  @UseInterceptors(FileInterceptor('file'))
  async parseCv(@UploadedFile() file: Express.Multer.File) {
    // 1. Guard Clause: Verify that a file was actually uploaded
    if (!file) {
      this.logger.warn('Attempted CV upload without a file.');
      throw new BadRequestException('Aucun fichier n\'a été fourni. Veuillez téléverser un CV au format PDF.');
    }

    // 2. Guard Clause: Validate that the uploaded file is a PDF
    if (file.mimetype !== 'application/pdf') {
      this.logger.warn(`Uploaded file has unsupported mimetype: ${file.mimetype}`);
      throw new BadRequestException('Type de fichier non supporté. Seuls les fichiers PDF sont acceptés.');
    }

    try {
      this.logger.log(`Received PDF upload: ${file.originalname} (${file.size} bytes)`);

      // 3. Delegate execution to the Hybrid parsing Facade
      const result = await this.cvParserFacade.parseCv(file.buffer);

      return result;
    } catch (error) {
      this.logger.error(`Error occurred during CV parsing pipeline: ${error.message}`);
      throw new InternalServerErrorException(
        `Une erreur interne est survenue lors du traitement sémantique du CV : ${error.message}`
      );
    }
  }




  @Get('evaluate')
  @HttpCode(HttpStatus.OK)
  async runEvaluation() {
    // Déclenche l'analyse comparative NLP
    const report = await this.cvEvaluationService.runAcademicEvaluation();
    
    return {
      status: 'success',
      message: 'Évaluation académique terminée avec succès.',
      timestamp: new Date().toISOString(),
      report,
    };
  }
}

