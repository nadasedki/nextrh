import { Repository } from 'typeorm';
import { Cv } from './entities/cv.entity';
export declare class CvService {
    private cvRepository;
    constructor(cvRepository: Repository<Cv>);
    saveIdentityCv(userId: number, filePath: string, cvJson: any): Promise<Cv>;
}
