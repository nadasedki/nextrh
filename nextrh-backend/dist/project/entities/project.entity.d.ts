import { User } from '../../users/entities/user.entity';
import { Cv } from 'src/cvs/entities/cv.entity';
export declare class Project {
    id: number;
    user_id: number;
    name: string;
    client: string;
    role: string;
    description: string;
    start_date: Date;
    end_date: Date;
    technologies: string[];
    user: User;
    cv: Cv;
}
