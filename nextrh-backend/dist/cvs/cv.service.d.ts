import { DataSource, Repository } from 'typeorm';
import { Cv } from './entities/cv.entity';
export declare class CvService {
    private cvRepository;
    private dataSource;
    constructor(cvRepository: Repository<Cv>, dataSource: DataSource);
    saveIdentityCv(userId: number, filePath: string, cvJson: any): Promise<Cv>;
    getFullCvData(cvId: number): Promise<any>;
}
