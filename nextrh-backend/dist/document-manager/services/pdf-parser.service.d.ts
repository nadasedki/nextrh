export declare class PdfParserService {
    private readonly logger;
    private readonly model;
    private readonly MAX_SINGLE_PASS_LENGTH;
    constructor();
    extractRawText(fileBuffer: Buffer): Promise<string>;
}
