import { DataSource } from 'typeorm';
export declare class CvService {
    private dataSource;
    constructor(dataSource: DataSource);
    getAllCVs(): Promise<any>;
    private buildText;
    chunkText(text: string, chunkSize?: number): string[];
    getAllNames(): Promise<string[]>;
}
