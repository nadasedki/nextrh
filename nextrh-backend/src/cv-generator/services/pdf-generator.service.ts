// src/cv-generator/pdf-generator.service.ts (or services/pdf-generator.service.ts)
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  async generate(htmlContent: string): Promise<Buffer> {
    this.logger.log('Launching headless browser to render PDF...');
    let browser: puppeteer.Browser | null = null;

    try {
      // 1. Launch with flags to prevent Windows/sandbox deadlocks
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=none',
        ],
      });

      const page = await browser.newPage();

      // 2.  USE 'domcontentloaded' with a 30s timeout so it NEVER hangs on external fonts/images!
      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // 3. Render A4 PDF
      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      this.logger.log('PDF rendered successfully by Puppeteer!');
      return Buffer.from(pdfUint8Array);

    } catch (error: any) {
      this.logger.error(`Puppeteer rendering error: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to render PDF: ${error.message}`);
    } finally {
      // 4. Always close browser to prevent memory leak / hanging processes
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }
}