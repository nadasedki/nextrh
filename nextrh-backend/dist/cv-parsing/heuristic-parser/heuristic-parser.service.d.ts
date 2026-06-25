export declare class HeuristicParserService {
    extractContactInfo(header: string, fullText: string): {
        name: string;
        profession: string;
        phone: string;
        fax: string;
        email: string;
        address: string;
    };
    extractExperience(section: string): any[];
    extractCertifications(section: string): any[];
    private parseFrenchDate;
    private inferProvider;
    extractEducation(section: string): any[];
    extractProjects(section: string): any[];
    extractSkills(section: string): any[];
}
