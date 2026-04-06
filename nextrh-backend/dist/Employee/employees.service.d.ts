import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Project } from '../project/entities/project.entity';
import { Training } from '../training/entities/training.entity';
import { Certification } from '../certifications/entities/certification.entity';
import { Cv } from '../cvs/entities/cv.entity';
import { UserSkill } from 'src/skill/entities/user-skill.entity';
import { Team } from 'src/users/entities/team.entity';
export declare class EmployeesService {
    private userRepository;
    private projectRepository;
    private trainingRepository;
    private certificationRepository;
    private cvRepository;
    private userSkillRepository;
    private certRepository;
    private teamRepository;
    constructor(userRepository: Repository<User>, projectRepository: Repository<Project>, trainingRepository: Repository<Training>, certificationRepository: Repository<Certification>, cvRepository: Repository<Cv>, userSkillRepository: Repository<UserSkill>, certRepository: Repository<Certification>, teamRepository: Repository<Team>);
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
        title: string;
        email: string;
        department: string;
        summary: string;
        skills: string[];
        projects: {
            id: number;
            name: string;
            role: string;
            client: string;
            startDate: Date;
            endDate: Date;
            description: string;
            technologies: string[];
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
        education: any[];
    }>;
    findAllEmployees(): Promise<User[]>;
    searchEmployees(query: string): Promise<User[]>;
    findOne(id: number): Promise<User>;
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
