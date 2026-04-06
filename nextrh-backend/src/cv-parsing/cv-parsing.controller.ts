import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,Body,UseGuards,Req, BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CvParsingService } from './cv-parsing.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import { extname, join } from 'path';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
@Controller('cv-parsing')

export class CvParsingController {


  constructor(private readonly cvService: CvParsingService) {}
@Post('test')
async testPdf(@Body() body: { filePath: string }) {
  const text = await this.cvService.extractTextFromPdf(body.filePath);

  return {
    status: 'success',
    raw_text: text,
  };
}
  /*ocr to remove later
  @Post('uploadoldcode')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueName = Date.now() + path.extname(file.originalname);
          callback(null, uniqueName);
        },
      }),
    }),
  )
  async uploadAndExtract(@UploadedFile() file: Express.Multer.File) {

    if (!file) {
      throw new Error('No file uploaded');
    }

    const rawText = await this.cvService.processPdf(file.path);

    return {
      status: 'success',
      raw_text: rawText,
    };
  }*/
 @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads', // Ensure this folder exists or create it
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @UseGuards(JwtAuthGuard)
  async uploadFile(@Req() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // Now file.path will exist (e.g., "uploads/file-123.pdf")
    // Use path.resolve to make sure it's an absolute path for Windows
    const absolutePath = require('path').resolve(file.path);
    
    //const rawText = await this.cvService.extractTextFromPdf(absolutePath);
    //const organizedData = await this.cvService.parseEntireCv(rawText);
      const employeeId = req.user.userId;
      const organizedData = await this.cvService.processPdf(absolutePath, employeeId);
    return {
      status: "success",
      data: organizedData,
    };
  }
  }

