import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterDto } from '../auth/dto/register.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<import("./entities/user.entity").User[]>;
    getTeamMembers(req: any): Promise<import("./entities/user.entity").User[]>;
    findOne(id: number): Promise<import("./entities/user.entity").User>;
    create(dto: RegisterDto): Promise<import("./entities/user.entity").User>;
    update(id: number, dto: UpdateUserDto): Promise<import("./entities/user.entity").User>;
    remove(id: number): Promise<import("./entities/user.entity").User>;
    getGlobalAdminStats(): Promise<{
        totalUsers: number;
        totalTeams: number;
        totalCerts: number;
    }>;
}
