import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Project } from '../project/entities/project.entity';
import { Training } from '../training/entities/training.entity';
import { Certification } from '../certifications/entities/certification.entity';
import { Cv } from '../cvs/entities/cv.entity';
import { Team } from 'src/users/entities/team.entity';
import { Education } from 'src/education/entities/education.entity';
export declare class EmployeesService {
    private userRepository;
    private projectRepository;
    private trainingRepository;
    private certificationRepository;
    private cvRepository;
    private educationRepository;
    private certRepository;
    private teamRepository;
    constructor(userRepository: Repository<User>, projectRepository: Repository<Project>, trainingRepository: Repository<Training>, certificationRepository: Repository<Certification>, cvRepository: Repository<Cv>, educationRepository: Repository<Education>, certRepository: Repository<Certification>, teamRepository: Repository<Team>);
    getDashboardData(userId: number): Promise<{
        title: string;
        yearsOfExperience: number;
        certifications: {
            id: number;
            name: string;
            issuer: string;
            status: string;
        }[];
        trainings: {
            id: number;
            name: string;
        }[];
        projects: {
            id: number;
            name: string;
        }[];
        cvLastUpdated: string;
    }>;
    getFullEmployeeCv(userId: number): Promise<{
        name: string;
        profession: string;
        email: string;
        phone: string;
        fax: string;
        address: string;
        skills: any[];
        projects: {
            id: number;
            name: string;
            client: string;
            startDate: Date;
            endDate: Date;
            description: string;
        }[];
        certifications: {
            id: number;
            name: string;
            issuer: string;
            expirationDate: Date;
            status: string;
        }[];
        trainings: {
            id: number;
            name: string;
            provider: string;
            completionDate: string;
            duration: string;
        }[];
        education: {
            id: number;
            degree: string;
            field: string;
            institution: string;
            graduationYear: number;
            startYear: number;
        }[];
    }>;
    findAllEmployees(): Promise<User[]>;
    searchEmployees(query: string): Promise<User[]>;
    findOne(id: number): Promise<{
        cv_full_name: string;
        cv_profession: string;
        cv_phone: string;
        cv_fax: string;
        cv_address: string;
        cv_skills: string[];
        cv_email: string;
        cv_last_updated: Date;
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
        role: import("../users/entities/role.entity").Role;
        created_at: Date;
        updated_at: Date;
        teams: Team[];
        certifications: Certification[];
        trainings: Training[];
        projects: Project[];
    }>;
    calculateDashboardStats(): Promise<{
        totalEmployees: number;
        totalCertifications: number;
        expiringThisMonth: number;
        totalTeams: number;
        certificationStatus: {
            active: number;
            expiringSoon: number;
            expired: number;
        };
        certificationsByProvider: {
            name: string;
            value: number;
        }[];
    }>;
}
