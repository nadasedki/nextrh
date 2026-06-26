import { Repository } from 'typeorm';
import { Team } from '../users/entities/team.entity';
import { AddMemberDto } from './dto/add-member.dto';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { AuthService } from 'src/auth/auth.service';
export declare class TeamsService {
    private teamRepo;
    private userRepo;
    private usersService;
    private authService;
    constructor(teamRepo: Repository<Team>, userRepo: Repository<User>, usersService: UsersService, authService: AuthService);
    addMemberByEmail(leaderId: number, email: string): Promise<{
        message: string;
        user_id: number;
    }>;
    create(dto: {
        team_name: string;
        team_leader_id: number;
    }): Promise<Team>;
    findAll(): Promise<Team[]>;
    getMyTeam(leaderId: number): Promise<Team>;
    addMember(dto: AddMemberDto): Promise<{
        message: string;
    }>;
    findByLeader(leaderId: number): Promise<Team>;
    removeMember(dto: {
        team_id: number;
        user_id: number;
    }): Promise<{
        message: string;
    }>;
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
            employeeName: string;
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
