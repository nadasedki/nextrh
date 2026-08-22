import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CvExtractionOrchestrator } from './cv-extraction-orchestrator.service';
import { CvEvaluationService } from './services/cv-evaluation.service';
import { ConfigService } from '@nestjs/config'
import { CvMultimodalParserService }    from './cv-multimodal-parser.service';
// 10 MB file size limit — protects against oversized uploads
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB


@Controller('cv-parser')
export class CvParserController {
  private readonly logger = new Logger(CvParserController.name);

  constructor(
    private readonly cvParserOrchestrator: CvExtractionOrchestrator, 
    private readonly cvEvaluationService: CvEvaluationService,
    private readonly configService: ConfigService,  
    private readonly geminiParser: CvMultimodalParserService, 
  ) {}

  /**
   * POST /documents/parse
   * Accepts a PDF CV and runs the hybrid heuristic + parallelized LLM parsing pipeline.
   */
  @Post('parse')
  //@UseGuards(JwtAuthGuard) 
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE_BYTES }, 
      fileFilter: (_req, file, cb) => {
        file.mimetype === 'application/pdf'
          ? cb(null, true)
          : cb(new BadRequestException('Only PDF files are accepted.'), false);
      },
    }),
  )
  async parseCv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      this.logger.warn('CV upload attempted with no file.'); 
      throw new BadRequestException('No file provided. Please upload a PDF CV.');
    }

    this.logger.log(`CV upload received: ${file.originalname} (${file.size} bytes)`);

    // Switch parser based on environment configuration ('heuristic' or 'gemini') 
    const mode = this.configService.get<string>('PARSER_MODE', 'heuristic');

    try {
      if (mode === 'gemini') {
        this.logger.log('Using Gemini multimodal parser strategy [1]');
        return await this.geminiParser.parseCvPdf(file.buffer); // Calls your new visual VLM parser 
      }

      this.logger.log('Using heuristic cascade parser strategy [1]');
      return await this.cvParserOrchestrator.parseCv(file.buffer); 

    } catch (err: any) {
      this.logger.error(`CV parsing failed (mode: ${mode}): ${err.message}`);
      throw new InternalServerErrorException(
        'An error occurred during CV processing. Please try again.',
      );
    }
  }

 /**
   * GET /cv-parser/evaluate
   * Runs the academic NLP evaluation suite against the ground truth dataset.
   * Pass ?cacheOnly=true to aggregate only pre-parsed cached files.
   * Example: GET http://localhost:3000/cv-parser/evaluate?cacheOnly=true 
   */
  @Get('evaluate')
  //@UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async runEvaluation(@Query('cacheOnly') cacheOnlyStr?: string) {
    this.logger.log('Academic evaluation suite triggered.');

    const cacheOnly = cacheOnlyStr === 'true';
    const report = await this.cvEvaluationService.runAcademicEvaluation(cacheOnly);

    return {
      status: 'success',
      message: cacheOnly
        ? 'Incremental evaluation report generated from cached runs.'
        : 'Complete academic evaluation completed successfully.',
      timestamp: new Date().toISOString(),
      report,
    };
  }

  /**
   * GET /cv-parser/evaluate/:fileName
   * Runs the 3-way academic evaluation on a single specific CV in your ground truth dataset.
   * Example: GET http://localhost:3000/cv-parser/evaluate/cv1.pdf 
   */
  @Get('evaluate/:fileName')
  //@UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async evaluateSingleCv(@Param('fileName') fileName: string) {
    this.logger.log(`Single CV evaluation triggered for file: ${fileName}`);
    return await this.cvEvaluationService.evaluateCv(fileName);
  }
  }




 /* @Post('parse')
  //@UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          cb(new BadRequestException('Only PDF files are accepted.'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async parseCv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      this.logger.warn('CV upload attempted with no file.');
      throw new BadRequestException('No file provided. Please upload a PDF CV.');
    }

    this.logger.log(`CV upload received: ${file.originalname} (${file.size} bytes)`);

    try {
      // Delegates to the new orchestrator's pipeline
      return await this.cvParserOrchestrator.parseCv(file.buffer);
    } catch (err: any) {
      this.logger.error(`CV parsing pipeline failed: ${err.message}`);
      throw new InternalServerErrorException(
        'An internal error occurred during CV processing. Please try again.',
      );
    }
  }
*/