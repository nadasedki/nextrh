import { EmployeesService } from './employees.service';
export declare class EmployeesController {
    private readonly employeesService;
    constructor(employeesService: EmployeesService);
    findMe(req: any): Promise<{
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
    getMyCvData(req: any): Promise<{
        id: number;
        filePath: string;
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
        experiences: {
            id: number;
            company: string;
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
    getAllEmployees(searchQuery?: string): Promise<import("../users/entities/user.entity").User[]>;
    getDashboardStats(): Promise<{
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
    getEmployeeById(id: number): Promise<{
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
        teams: import("../teams/entities/team.entity").Team[];
        certifications: import("../certifications/entities/certification.entity").Certification[];
        trainings: import("../training/entities/training.entity").Training[];
        projects: import("../project/entities/project.entity").Project[];
    }>;
}
