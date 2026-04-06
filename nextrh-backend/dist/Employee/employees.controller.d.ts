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
    getEmployeeById(id: number): Promise<import("../users/entities/user.entity").User>;
}
