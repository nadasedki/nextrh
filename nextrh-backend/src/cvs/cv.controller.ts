import { Controller, Post, Body, UseGuards, Req, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { CvService } from './cv.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('cvs')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCv(@Req() req, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
    if (!file) throw new BadRequestException('No file uploaded');

    const userId = req.user.userId;
    const cvJson = body.cvJson; // assume client sends parsed JSON
    const savedCv = await this.cvService.saveIdentityCv(userId, file.path, cvJson);

    return { status: 'success', data: savedCv };
  }
}