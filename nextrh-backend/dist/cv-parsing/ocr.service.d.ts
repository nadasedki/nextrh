export declare class OcrService {
    extractTextFromImage(imagePath: string): Promise<string>;
    extractTextFromPdf(pdfPath: string): Promise<string>;
}
