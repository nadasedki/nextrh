export declare class ParserService {
    pdfToImages(pdfPath: string, outputDir?: string): Promise<string[]>;
    extractTextFromImage(imagePath: string): Promise<{
        text: string;
        confidence: number;
    }>;
    extractTextFromPdf(pdfPath: string): Promise<{
        text: string;
        confidence: number;
    }>;
    private cleanText;
    formatDateToISO(dateStr: string | null | undefined): string | null;
}
