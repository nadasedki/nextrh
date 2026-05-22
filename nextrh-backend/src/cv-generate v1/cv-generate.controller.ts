import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CvGenerateService } from './cv-generate.service';
import { Response } from 'express';

@Controller('cv')
export class CvGenerateController {
  constructor(private readonly cvService: CvGenerateService) {}

  @Post('smart-pdf/:cvId')
  @UseInterceptors(FileInterceptor('file'))
  async smartGenerate(
    @Param('cvId') cvId: string,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier template fourni');
    }

    try {
      console.log(`Début de la génération intelligente pour le CV #${cvId}`);

      // 1. On appelle l'orchestrateur du service (Python + IA + XML)
      // Il nous renvoie directement le Buffer du fichier Word final
      const finalBuffer = await this.cvService.processSmartTemplate(+cvId, file);

      // 2. Configuration des headers pour le téléchargement du DOCX
      const outputFileName = `CV_Final_${Date.now()}.docx`;
      
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename=${outputFileName}`,
        'Content-Length': finalBuffer.length,
      });

      // 3. Envoi du Buffer au client
      return res.end(finalBuffer);

    } catch (error) {
      console.error('Erreur Controller:', error.message);
      res.status(500).json({
        message: 'Erreur lors de la génération intelligente du CV',
        error: error.message,
      });
    }
  }
}