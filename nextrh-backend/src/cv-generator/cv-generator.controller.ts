import {
  Controller, Post, Body, Res, HttpStatus,
  UseInterceptors, UploadedFile,
  BadRequestException, InternalServerErrorException,
  Logger, UseGuards, HttpCode,
  Get,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CvTemplateService } from './cv-template.service';
import { CvDataFormatterService } from './cv-data-formatter.service';
import { PdfGeneratorService } from './pdf-generator.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Controller('cv')
//@UseGuards(JwtAuthGuard)
export class CvGeneratorController {
  private readonly logger = new Logger(CvGeneratorController.name);

  constructor(
    private readonly templateService: CvTemplateService,
    private readonly dataFormatter:   CvDataFormatterService, // Only formatted data is requested
    private readonly pdfGenerator:    PdfGeneratorService,
  ) {}

  // STAGE 1 — upload and analyze template (Call 1 — vision LLM)
  @Post('templates/upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      file.mimetype === 'application/pdf'
        ? cb(null, true)
        : cb(new BadRequestException('Only PDF files are accepted.'), false);
    },
  }))
  async uploadTemplate(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('userId') userIdStr: string,
  ) {
    if (!file) throw new BadRequestException('A PDF template file is required.');
    if (!name) throw new BadRequestException('A template name is required.');

    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) throw new BadRequestException('userId must be a valid number.');

    try {
      const { templateId } = await this.templateService.extractSkeleton(
        file.buffer,
        name,
        userId,
      );

      return {
        message:    'Template analyzed and stored. Ready for generation.',
        templateId,
      };
    } catch (err: any) {
      this.logger.error(`Template upload failed: ${err.message}`);
      throw new InternalServerErrorException(`Template analysis failed: ${err.message}`);
    }
  }

  // STAGE 2 — generate CV for a candidate (Call 2 — text LLM + Puppeteer)
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateCv(
    @Body('templateId') templateIdStr: string,
    @Body('userId') userIdStr: string,
    @Res() res: Response,
  ) {
    if (!templateIdStr || !userIdStr) {
      throw new BadRequestException('templateId and userId are required.');
    }

    const templateId = templateIdStr; 
    const userId     = parseInt(userIdStr, 10);

    if (typeof templateId !== 'string' || isNaN(userId)) {
      throw new BadRequestException('templateId must be a valid UUID string and userId must be a valid number.');
    }

    try {
      // 1. Load layout skeleton from DB (0 expensive AI calls)
      const skeleton = await this.templateService.getSkeleton(templateId);

      // 2. Fetch and format candidate data dynamically in one single service step [1.1.2]
      const candidateData = await this.dataFormatter.getFormattedCandidateData(userId);

      // 3. Call 2 (Semantic compilation): Compile candidate JSON into the HTML skeleton
      const populatedHtml = await this.templateService.compileSkeleton(skeleton, candidateData);

      // 4. Print HTML directly to PDF
      const pdfBuffer = await this.pdfGenerator.generate(populatedHtml);

      res.set({
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="cv_${userId}_${templateId}.pdf"`,
        'Content-Length':      pdfBuffer.length,
      });

      return res.status(HttpStatus.OK).send(pdfBuffer);

    } catch (err: any) {
      this.logger.error(`CV generation failed: ${err.message}`);
      throw new InternalServerErrorException(`CV generation failed: ${err.message}`);
    }
  }
  /**
   
   * GET /cv/templates
   * Retrieves the raw list of saved visual skeleton models [2]
   */
/**
   * Retrieves all saved CV templates from the database [2]
   */
@Get('templates')
  @HttpCode(HttpStatus.OK)
  async getTemplates() {
    return this.templateService.findAll(); 
  }

  /**
   * Temporary diagnostic endpoint to test database queries and data formatting.
   * Access directly in your browser: http://localhost:3000/cv/test-data/1
   */
  @Get('test-data/:userId')
  async testCandidateData(@Param('userId') userIdStr: string) {
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      throw new BadRequestException('userId must be a valid number.');
    }

    try {
      const formattedData = await this.dataFormatter.getFormattedCandidateData(userId);
      return {
        statusCode: HttpStatus.OK,
        message: `Successfully retrieved and formatted database records for user #${userId}`,
        data: formattedData,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to retrieve and format candidate data: ${error.message}`
      );
    }
  }
}