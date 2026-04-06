import { UsersService } from './users/users.service';
import { UpdateUserDto } from './users/dto/update-user.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<import("./users/entities/user.entity").User[]>;
    update(id: number, dto: UpdateUserDto): Promise<import("./users/entities/user.entity").User>;
}
