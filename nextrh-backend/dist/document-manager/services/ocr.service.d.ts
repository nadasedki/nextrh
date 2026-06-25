export declare class OcrService {
    private readonly logger;
    extractTextFromPdf(pdfBuffer: Buffer, language?: string): Promise<string>;
}
