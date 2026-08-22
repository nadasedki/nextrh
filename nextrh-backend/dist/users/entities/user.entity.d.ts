import { Role } from './role.entity';
import { Team } from '../../teams/entities/team.entity';
import { Certification } from 'src/certifications/entities/certification.entity';
import { Project } from 'src/project/entities/project.entity';
import { Training } from 'src/training/entities/training.entity';
export declare class User {
    user_id: number;
    email: string;
    password_hash: string;
    full_name: string;
    active: boolean;
    title: string;
    department: string;
    years_of_experience: number;
    summary: string;
    score: number;
    role: Role;
    created_at: Date;
    updated_at: Date;
    teams: Team[];
    certifications: Certification[];
    trainings: Training[];
    projects: Project[];
}
