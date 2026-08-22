export declare class PdfGeneratorService {
    private readonly logger;
    generate(htmlContent: string): Promise<Buffer>;
}
