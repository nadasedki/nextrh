import { Controller, Post, Param, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CvGeneratorService } from './cv-generator.service';
import { Response } from 'express';

@Controller('cv-generator')
export class CvGeneratorController {
  constructor(private readonly generatorService: CvGeneratorService) {}

  @Post('download/:cvId')
  @UseInterceptors(FileInterceptor('template'))
  async generate(
    @Param('cvId') cvId: string,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response
  ) {
    const templateContent = file.buffer.toString('utf-8');
    const pdfBuffer = await this.generatorService.generateSmartPdf(+cvId, templateContent);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=CV_Genere_${cvId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}