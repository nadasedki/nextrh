import { User } from '../../users/entities/user.entity';
import { Cv } from 'src/cvs/entities/cv.entity';
export declare class Experience {
    id: number;
    user_id: number;
    company: string;
    role: string;
    start_date: Date;
    end_date: Date;
    description: string;
    user: User;
    cv: Cv;
}
