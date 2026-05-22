import { DataSource } from 'typeorm';
export declare class CvService {
    private dataSource;
    constructor(dataSource: DataSource);
    getAllUnifiedProfiles(): Promise<any>;
    getAllNames(): Promise<string[]>;
}
