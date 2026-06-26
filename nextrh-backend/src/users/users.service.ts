import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Team } from './entities/team.entity'; 
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { Experience } from 'src/experience/entities/experience.entity';

@Injectable()
export class UsersService {
  
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    @InjectRepository(Experience)
private experienceRepo: Repository<Experience>
  ) {}

async create(dto: RegisterDto) {
    // Fetch the single selected role using role_id from the DTO
    const role = await this.roleRepo.findOne({ where: { role_id: dto.role_id } });

    const user = this.userRepo.create({
      email: dto.email,
      password_hash: dto.password_hash,
      full_name: dto.full_name,
      role, // Assign the singular role
    });

    return this.userRepo.save(user);
  }


  async update(user_id: number, dto: UpdateUserDto) {
    const user = await this.userRepo.findOne({
      where: { user_id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.full_name) {
      user.full_name = dto.full_name;
    }

    if (dto.role_id !== undefined) {
      const role = await this.roleRepo.findOne({
        where: { role_id: dto.role_id },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      user.role = role;
    }

    if (dto.active !== undefined) {
      user.active = dto.active;
    }

    return this.userRepo.save(user);
  }

  async findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email }, relations: ['role'] });
  }

  async findOneById(user_id: number) {
    return this.userRepo.findOne({ where: { user_id }, relations: ['role'] });
  }



 async findAll() {
    return this.userRepo.find({ relations: ['role'] });
  }




async remove(user_id: number) {
  const user = await this.userRepo.findOne({ where: { user_id } });
  if (!user) return null;
  user.active = false; 
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

async updateProfileFromCv(
  userId: number,
  fullName?: string,
  title?: string,
) {
  const user = await this.userRepo.findOne({
    where: { user_id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (fullName) {
    user.full_name = fullName;
  }

  if (title) {
    user.title = title;
  }

  return this.userRepo.save(user);
}
async updateYearsOfExperience(userId: number, years: number) {
  await this.userRepo.update(userId, {
    years_of_experience: years,
  });

  return years;
}
}