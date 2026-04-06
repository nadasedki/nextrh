export declare class ParserService {
    pdfToImages(pdfPath: string, outputDir?: string): Promise<string[]>;
    extractTextFromImage(imagePath: string): Promise<string>;
    extractTextFromPdf(pdfPath: string): Promise<string>;
}
