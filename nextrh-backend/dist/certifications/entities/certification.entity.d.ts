import { User } from '../../users/entities/user.entity';
import { Cv } from 'src/cvs/entities/cv.entity';
export declare class Certification {
    certId: number;
    certName: string;
    provider: string;
    issueDate: Date;
    expiryDate: Date;
    filePath: string;
    status: string;
    credentialId: string;
    user: User;
    userId: number;
    cv: Cv;
}
