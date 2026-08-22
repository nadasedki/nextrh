import { DataSource } from 'typeorm';
export interface CvProfile {
    cv_id: number;
    user_id: number;
    full_name: string;
    profession?: string;
    email?: string;
    address?: string;
    skills?: string;
    active_generation?: number;
}
export declare class EmployeeProfileService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    getAllCVs(): Promise<CvProfile[]>;
    getCVByUserId(userId: number): Promise<CvProfile | null>;
    getAllCertifications(): Promise<any>;
    getEducationByUserId(userId: number): Promise<any>;
    getProjectsByUserId(userId: number): Promise<any>;
    getExperiencesByUserId(userId: number): Promise<any>;
    getCertificationsByUserId(userId: number): Promise<any>;
    getTrainingsByUserId(userId: number): Promise<any>;
}
