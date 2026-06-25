import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Team } from './entities/team.entity';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { Experience } from 'src/experience/entities/experience.entity';
export declare class UsersService {
    private userRepo;
    private roleRepo;
    private teamRepo;
    private experienceRepo;
    constructor(userRepo: Repository<User>, roleRepo: Repository<Role>, teamRepo: Repository<Team>, experienceRepo: Repository<Experience>);
    create(dto: RegisterDto): Promise<User>;
    findByEmail(email: string): Promise<User>;
    findAll(): Promise<User[]>;
    update(user_id: number, dto: Partial<RegisterDto> & {
        active?: boolean;
    }): Promise<User>;
    findOneById(user_id: number): Promise<User>;
    remove(user_id: number): Promise<User>;
    findTeamMembers(team_leader_id: number): Promise<User[]>;
    updatePassword(userId: number, hashedPassword: string): Promise<User>;
    updateProfileFromCv(userId: number, fullName?: string, title?: string): Promise<User>;
    updateYearsOfExperience(userId: number, years: number): Promise<number>;
}
