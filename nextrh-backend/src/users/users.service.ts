import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Team } from './entities/team.entity'; 
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterDto } from 'src/auth/dto/register.dto';

@Injectable()
export class UsersService {
  
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
  ) {}

async create(dto: RegisterDto) {
  // Fetch all roles the user selected
  const roles = await this.roleRepo.findByIds(dto.role_ids);

  const user = this.userRepo.create({
    email: dto.email,
    password_hash: dto.password_hash,
    full_name: dto.full_name,
    roles, // Assign array of roles
  });

  return this.userRepo.save(user); // This will now save multiple roles
}



  async findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email }, relations: ['roles'] });
  }

  async findAll() {
    return this.userRepo.find({ relations: ['roles'] });
  }

async update(user_id: number, dto: Partial<RegisterDto> & { active?: boolean }) {
    const user = await this.userRepo.findOne({ where: { user_id }, relations: ['roles'] });
    if (!user) return null;

    if (dto.full_name) user.full_name = dto.full_name;
    if (dto.role_ids) user.roles = await this.roleRepo.findByIds(dto.role_ids);
    if (dto.active !== undefined) user.active = dto.active;

    return this.userRepo.save(user);
  }
async findOneById(user_id: number) {
  return this.userRepo.findOne({ where: { user_id }, relations: ['roles'] });
}

async remove(user_id: number) {
  const user = await this.userRepo.findOne({ where: { user_id } });
  if (!user) return null;
  user.active = false; // soft delete
  return this.userRepo.save(user);
}
async findTeamMembers(team_leader_id: number) {
    //  Find the team led by this leader
    const team = await this.teamRepo.findOne({ where: { team_leader_id } });
    if (!team) return []; // no team assigned

    //  Get all users in that team
    const members = await this.userRepo
      .createQueryBuilder('user')
      .innerJoin('team_members', 'tm', 'tm.user_id = user.user_id')
      .where('tm.team_id = :teamId', { teamId: team.team_id })
      .leftJoinAndSelect('user.roles', 'roles')
      .getMany();

    return members;
  }
  async updatePassword(userId: number, hashedPassword: string) {
  const user = await this.userRepo.findOne({ where: { user_id: userId } });
  if (!user) throw new NotFoundException('User not found');
  user.password_hash = hashedPassword;
  return this.userRepo.save(user);
}

}
