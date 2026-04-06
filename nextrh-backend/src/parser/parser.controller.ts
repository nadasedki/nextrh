import { ParserService } from './parser.service';
import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
@Controller('parser')
export class ParserController {
     constructor(
    private readonly parserService: ParserService,
    private readonly AiService: AiService,
  ) {}
  @Post('extract-certificate')
  async extractCertificate(@Body() body: any) {
    const { filePath } = body;  // just read filePath directly
    try {
      const data = await this.AiService.extractCertificate(filePath);
      return { status: 'success', data };
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  }
  
}
