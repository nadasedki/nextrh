import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddMemberDto } from 'src/teams/dto/add-member.dto';
export declare class TeamsController {
    private readonly teamsService;
    constructor(teamsService: TeamsService);
    create(dto: CreateTeamDto): Promise<import("../users/entities/team.entity").Team>;
    findAll(): Promise<import("../users/entities/team.entity").Team[]>;
    addMember(req: any, email: string): Promise<{
        message: string;
        user_id: number;
    }>;
    getMyTeam(req: any): Promise<import("../users/entities/team.entity").Team>;
    removeMember(dto: AddMemberDto): Promise<{
        message: string;
    }>;
    findOne(id: number): Promise<import("../users/entities/team.entity").Team>;
    getMyTeamMembers(req: any): Promise<{
        id: number;
        name: string;
        email: string;
        title: string;
        yearsOfExperience: number;
        certifications: import("../certifications/entities/certification.entity").Certification[];
    }[]>;
    getMyTeamStats(req: any): Promise<{
        teamName: string;
        totalMembers: number;
        certStats: {
            active: number;
            expiringSoon: number;
            expired: number;
        };
        topProviders: {
            name: string;
            value: number;
        }[];
        expiringCerts: {
            employeeName: string;
            certId: number;
            certName: string;
            provider: string;
            issueDate: Date;
            expiryDate: Date;
            filePath: string;
            status: string;
            credentialId: string;
            user: import("../users/entities/user.entity").User;
            userId: number;
            cv: import("../cvs/entities/cv.entity").Cv;
        }[];
    }>;
    getMyTeamCertifications(req: any): Promise<{
        employeeName: string;
        employeeTitle: string;
        certId: number;
        certName: string;
        provider: string;
        issueDate: Date;
        expiryDate: Date;
        filePath: string;
        status: string;
        credentialId: string;
        user: import("../users/entities/user.entity").User;
        userId: number;
        cv: import("../cvs/entities/cv.entity").Cv;
    }[]>;
}
