export declare class PdfExtractorService {
    extractTextFromPdf(pdfPath: string): Promise<string>;
    extractRawText(pdfPath: string): Promise<string>;
}
