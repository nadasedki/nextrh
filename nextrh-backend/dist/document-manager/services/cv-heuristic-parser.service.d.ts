export declare class CvHeuristicParserService {
    private readonly logger;
    private readonly monthMap;
    parse(rawText: string, cvId?: number, userId?: number, filePath?: string): {
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
        certifications: any[];
        education: any[];
        projects: any[];
        experiences: any[];
    };
    private cleanRawText;
    segmentText(text: string): Record<string, string>;
    private parseMonthYearToDate;
    private parseYearToEndDate;
    private extractContactInfo;
    private extractSkills;
    private extractCertifications;
    private extractEducation;
    private parseEducationBlock;
    private extractProjects;
    private extractExperiences;
}
