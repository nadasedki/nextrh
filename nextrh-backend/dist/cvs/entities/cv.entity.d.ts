import { User } from '../../users/entities/user.entity';
import { Education } from 'src/education/entities/education.entity';
import { Project } from 'src/project/entities/project.entity';
import { Experience } from 'src/experience/entities/experience.entity';
import { Certification } from 'src/certifications/entities/certification.entity';
export declare class Cv {
    cv_id: number;
    user_id: number;
    file_path: string;
    format: string;
    generated: boolean;
    last_updated: Date;
    full_name: string;
    profession: string;
    email: string;
    phone: string;
    fax: string;
    address: string;
    skills: string[];
    educations: Education[];
    projects: Project[];
    experiences: Experience[];
    certifications: Certification[];
    user: User;
}
