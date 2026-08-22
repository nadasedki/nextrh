import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  /**
   * Directly renders fully-populated HTML/CSS into a high-fidelity A4 PDF buffer
   */
  async generate(htmlContent: string): Promise<Buffer> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      try {
        const page = await browser.newPage();
        
        // Load the final, compiled HTML straight into the browser
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Generate the PDF
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true, // Crucial to keep visual borders and background styles
          margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        });

        return Buffer.from(pdf);
      } finally {
        await browser.close();
      }
    } catch (error) {
      this.logger.error(`PDF generation failed: ${error.message}`);
      throw error;
    }
  }
}