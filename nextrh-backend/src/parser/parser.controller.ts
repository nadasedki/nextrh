import { ParserService } from './parser.service';
import { Controller, Post, Body, Inject } from '@nestjs/common';
import { AiService } from './ai.service';
import { EvaluationMetricsService } from './evaluation-metrics.service';
@Controller('parser')
export class ParserController {
     constructor(
    private readonly parserService: ParserService,
    private readonly AiService: AiService,
    @Inject(EvaluationMetricsService)
    private readonly metricsService: EvaluationMetricsService, 
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

  @Post('evaluate')
  // @UseGuards(JwtAuthGuard) 
  async triggerBatchEvaluation() {
  
    this.metricsService.runEvaluationAndSaveJson()
      .catch(err => console.error("Evaluation Async Error:", err));

    return {
      success: true,
      message: "Batch evaluation pipeline started. Checking files and generating metrics_report.json...",
    };
  }
  
}
