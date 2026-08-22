import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare class TeamsController {
    private readonly teamsService;
    constructor(teamsService: TeamsService);
    create(dto: CreateTeamDto): Promise<import("./entities/team.entity").Team>;
    findAll(): Promise<import("./entities/team.entity").Team[]>;
    addMember(user: any, dto: InviteMemberDto): Promise<{
        message: string;
        user_id: number;
    }>;
    getMyTeam(user: any): Promise<import("./entities/team.entity").Team>;
    removeMember(user: any, memberId: number): Promise<{
        message: string;
    }>;
    getMyTeamMembers(user: any): Promise<{
        id: number;
        name: string;
        email: string;
        title: string;
        yearsOfExperience: number;
        certifications: import("../certifications/entities/certification.entity").Certification[];
    }[]>;
    getMyTeamStats(user: any): Promise<{
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
            id: number;
            name: string;
            expiryDate: string;
            provider: string;
            employeeName: string;
        }[];
    }>;
    getMyTeamCertifications(user: any): Promise<{
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
    findOne(id: number): Promise<import("./entities/team.entity").Team>;
}
