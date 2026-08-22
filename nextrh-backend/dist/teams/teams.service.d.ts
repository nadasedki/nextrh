import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
export declare class TeamsService {
    private readonly teamRepo;
    private readonly userRepo;
    private readonly usersService;
    private readonly authService;
    constructor(teamRepo: Repository<Team>, userRepo: Repository<User>, usersService: UsersService, authService: AuthService);
    addMemberByEmail(leaderId: number, email: string): Promise<{
        message: string;
        user_id: number;
    }>;
    removeMemberFromLeaderTeam(leaderId: number, memberId: number): Promise<{
        message: string;
    }>;
    create(dto: {
        team_name: string;
        team_leader_id: number;
    }): Promise<Team>;
    findAll(): Promise<Team[]>;
    getMyTeam(leaderId: number): Promise<Team>;
    findOne(id: number): Promise<Team>;
    findMembersByManager(managerId: number): Promise<{
        id: number;
        name: string;
        email: string;
        title: string;
        yearsOfExperience: number;
        certifications: import("../certifications/entities/certification.entity").Certification[];
    }[]>;
    calculateTeamStats(leaderId: number): Promise<{
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
    findAllTeamCertifications(leaderId: number): Promise<{
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
        user: User;
        userId: number;
        cv: import("../cvs/entities/cv.entity").Cv;
    }[]>;
}
