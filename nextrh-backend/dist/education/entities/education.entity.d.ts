import { Cv } from 'src/cvs/entities/cv.entity';
export declare class Education {
    education_id: number;
    user_id: number;
    institution: string;
    degree: string;
    field_of_study: string;
    start_year: number;
    end_year: number;
    created_at: Date;
    cv: Cv;
}
