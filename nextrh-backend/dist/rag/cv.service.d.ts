import { DataSource } from 'typeorm';
export declare class CvService {
    private dataSource;
    constructor(dataSource: DataSource);
    getAllCVs(): Promise<any>;
    getAllCertifications(): Promise<any>;
    getEducationByCvId(cvId: number): Promise<any>;
    getProjectsByCvId(cvId: number): Promise<any>;
    getExperiencesByCvId(cvId: number): Promise<any>;
    getAllUnifiedProfiles(): Promise<any[]>;
    getAllNames(): Promise<string[]>;
    getCertificationsByCvId(cvId: number): Promise<any>;
    getCertificationWithCvContext(certId: number): Promise<any>;
}
