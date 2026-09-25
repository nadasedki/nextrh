import {
  Controller, Post, Body, Get, Delete, Param,
  UseInterceptors, UploadedFile, BadRequestException,
  HttpStatus, HttpCode, Req, UseGuards,
  Res,
  NotFoundException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CvTemplateService } from './services/cv-template.service';
import { CvGeneratorService } from './services/cv-generator.service';
import * as fs from 'fs';
import { Response } from 'express';

@Controller('cv')
export class CvGeneratorController {
  constructor(
    private readonly templateService: CvTemplateService,
    private readonly generatorService: CvGeneratorService,
  ) {}

  /**
   * POST /cv/templates/upload (Enqueues visual layout ingestion)
   */
  @UseGuards(JwtAuthGuard)
  @Post('templates/upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadTemplate(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('A PDF template file is required.');
    if (!name) throw new BadRequestException('A template name is required.');

    const userId = req.user?.userId || req.user?.id || 1;
    return await this.templateService.enqueueTemplateIngestion(file, name, userId);
  }

  /**
   * GET /cv/templates/status/:jobId (Polls template ingestion status)
   */
  @Get('templates/status/:jobId')
  async getTemplateIngestionStatus(@Param('jobId') jobId: string) {
    return await this.templateService.getIngestionJobStatus(jobId);
  }

  /**
   * GET /cv/templates (List all templates)
   */
  @Get('templates')
  async getTemplates() {
    return await this.templateService.findAll();
  }

  /**
   * DELETE /cv/templates/:id (Delete template)
   */
  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    await this.templateService.remove(id);
    return { message: 'Template deleted successfully.' };
  }

  /**
   * POST /cv/generate (Enqueues tailored CV PDF compilation)
   */
  @UseGuards(JwtAuthGuard)
  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  async generateCv(
    @Body('templateId') templateId: string,
    @Body('userId') userId: number,
  ) {
    if (!templateId || !userId) {
      throw new BadRequestException('templateId and userId are required.');
    }
    return await this.generatorService.enqueueCvGeneration(templateId, Number(userId));
  }

  /**
   * GET /cv/generate/status/:jobId (Polls CV generation status)
   */
  @Get('generate/status/:jobId')
  async getCvGenerationStatus(@Param('jobId') jobId: string) {
    return await this.generatorService.getGenerationJobStatus(jobId);
  }


  /**
   * GET /cv/download/:fileName
   * Streams the generated PDF file directly to the browser for download
   */
  @Get('download/:fileName')
  async downloadGeneratedPdf(
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    if (!fileName) throw new BadRequestException('File name is required.');

    const filePath = this.generatorService.getGeneratedFilePath(fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Generated PDF file not found on server.');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Stream the file directly from C:\nextrh_data\uploads\generated
    return res.sendFile(filePath);
  }
}