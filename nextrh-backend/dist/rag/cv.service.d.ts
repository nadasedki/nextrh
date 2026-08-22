import { DataSource } from 'typeorm';
import { CvProfile } from './types/cv-index.types';
export declare class CvService {
    private dataSource;
    constructor(dataSource: DataSource);
    getAllCVs(): Promise<CvProfile[]>;
    getCVByUserId(userId: number): Promise<CvProfile | null>;
    getAllCertifications(): Promise<any>;
    getEducationByUserId(userId: number): Promise<any>;
    getProjectsByUserId(userId: number): Promise<any>;
    getExperiencesByUserId(userId: number): Promise<any>;
    getCertificationsByUserId(userId: number): Promise<any>;
    getTrainingsByUserId(userId: number): Promise<any>;
    getCertificationWithCvContext(certId: number): Promise<any>;
    getAllNames(): Promise<string[]>;
}
