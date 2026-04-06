// src/teams/teams.service.ts
import { Injectable, NotFoundException, BadRequestException,Inject,forwardRef  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../users/entities/team.entity';
import { AddMemberDto } from './dto/add-member.dto';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service'; // Ensure this is imported
import { AuthService } from 'src/auth/auth.service';   // Ensure this is imported
import * as bcrypt from 'bcrypt';
@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService, // Inject UsersService
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,   // Inject AuthService
  ) {}
//add member
  async addMemberByEmail(leaderId: number, email: string) {
    // 1. Find the leader's team
    const team = await this.teamRepo.findOne({
      where: { team_leader_id: leaderId },
      relations: ['members'],
    });
    if (!team) throw new NotFoundException('Team not found for this leader');

    // 2. Check if user already exists
    let user = await this.usersService.findByEmail(email);
    
   // Inside src/teams/teams.service.ts -> addMemberByEmail method

if (!user) {
  // 1. Generate a random temporary password
  const generatedPassword = Math.random().toString(36).slice(-10); 
  const hashedPassword = await bcrypt.hash(generatedPassword, 10);

  // 2. Prepare the object to match RegisterDto exactly
  const registerDto = {
    email: email,
    password_hash: hashedPassword, // Passing the hashed password
    full_name: email.split('@')[0], // Temporary name from email
    role_ids: [1], // Hardcoded to 1 for EMPLOYEE
  };

  // 3. Create the user
  user = await this.usersService.create(registerDto);

  // 4. Send Welcome Email via AuthService
  await this.authService.sendWelcomeEmail(email, generatedPassword, user.full_name);
}
    // 5. Prevent duplicate in team
    if (team.members.some(m => m.user_id === user.user_id)) {
      throw new BadRequestException('User is already a member of this team');
    }

    // 6. Add to team and save
    team.members.push(user);
    await this.teamRepo.save(team);

    return { message: 'Member successfully invited and added to team', user_id: user.user_id };
  }
//end
  // Create a new team
  create(dto: { team_name: string; team_leader_id: number }) {
    const team = this.teamRepo.create(dto);
    return this.teamRepo.save(team);
  }

  // Get all teams
  findAll() {
    return this.teamRepo.find({
      relations: ['members','members.roles'], // include members
    });
  }

  // Get the team of a specific leader
 async getMyTeam(leaderId: number) {
    const team = await this.teamRepo.findOne({
      where: { team_leader_id: leaderId },
      relations: [
        'members',
        'members.roles',
        'members.certifications' // <--- ADD THIS RELATION
      ],
    });

    if (!team) throw new NotFoundException('No team found for this leader');

    return team;
  }

  // Add a member to a team
  async addMember(dto: AddMemberDto) {
    const team = await this.teamRepo.findOne({
      where: { team_id: dto.team_id },
      relations: ['members'],
    });

    if (!team) throw new NotFoundException('Team not found');

    const user = await this.userRepo.findOne({
      where: { user_id: dto.user_id },
    });

    if (!user) throw new NotFoundException('User not found');

    // Prevent duplicate member
    if (team.members.some(member => member.user_id === user.user_id)) {
      throw new BadRequestException('User is already a member of this team');
    }

    team.members.push(user);

    await this.teamRepo.save(team);

    return { message: 'User added to team' };
  }

  // Find a team by leader ID
  async findByLeader(leaderId: number) {
    const team = await this.teamRepo.findOne({
      where: { team_leader_id: leaderId },
      relations: ['members'],
    });

    if (!team) throw new NotFoundException('Team not found for this leader');

    return team;
  }

  // Remove a member from a team
  async removeMember(dto: { team_id: number; user_id: number }) {
    const team = await this.teamRepo.findOne({
      where: { team_id: dto.team_id },
      relations: ['members'],
    });

    if (!team) throw new NotFoundException('Team not found');

    // Remove the member
    team.members = team.members.filter(member => member.user_id !== dto.user_id);

    await this.teamRepo.save(team);

    return { message: 'User removed from team' };
  }
  // Get team by ID
async findOne(id: number) {
  const team = await this.teamRepo.findOne({
    where: { team_id: id },
    relations: ['members', 'members.roles'],
  });

  if (!team) {
    throw new NotFoundException('Team not found');
  }

  return team;
}
async findMembersByManager(managerId: number) {
    // Re-use the existing method to get the team
    const team = await this.getMyTeam(managerId);

    // Map members to the structure expected by the frontend
    return team.members.map(member => ({
      id: member.user_id,
      name: member.full_name,
      email: member.email,
      title: member.title || 'N/A',
      yearsOfExperience: member.years_of_experience || 0,
      skills: member.userSkills ? member.userSkills.map(us => us.skill.skill_name) : [],
      certifications: member.certifications || [], // Ensure this relation is loaded in User entity
    }));
  }
  async calculateTeamStats(leaderId: number) {
  // 1. Get the team with members and certifications
  const team = await this.teamRepo.findOne({
    where: { team_leader_id: leaderId },
    relations: ['members', 'members.certifications'],
  });

  if (!team) throw new NotFoundException('No team found for this leader');

  const members = team.members;
  const allCerts = members.flatMap(m => m.certifications);

  // 2. Calculate Stats
  const certStats = {
    active: allCerts.filter(c => c.status === 'active').length,
    expiringSoon: allCerts.filter(c => c.status === 'expiring_soon').length,
    expired: allCerts.filter(c => c.status === 'expired').length,
  };

  // 3. Certifications by Provider (Top 5)
  const providerStats = allCerts.reduce((acc, cert) => {
    acc[cert.provider] = (acc[cert.provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topProviders = Object.entries(providerStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // 4. Upcoming Expirations (Next 5)
  const expiringCerts = allCerts
    .filter(c => c.status === 'expiring_soon')
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    .slice(0, 5)
    .map(c => {
      // Find member name for the cert
      const member = members.find(m => m.certifications.some(mc => mc.certId === c.certId));
      return {
        ...c,
        employeeName: member?.full_name || 'Unknown'
      };
    });

  return {
    teamName: team.team_name,
    totalMembers: members.length,
    certStats,
    topProviders,
    expiringCerts,
  };
}
async findAllTeamCertifications(leaderId: number) {
  // 1. Get the team with members and certifications
  const team = await this.teamRepo.findOne({
    where: { team_leader_id: leaderId },
    relations: ['members', 'members.certifications'],
  });

  if (!team) throw new NotFoundException('No team found for this leader');

  // 2. Flatten certifications and map to include employee details
  const certsWithEmployee = team.members.flatMap(member => 
    member.certifications.map(cert => ({
      ...cert,
      employeeName: member.full_name,
      employeeTitle: member.title || 'N/A',
      // Ensure backend status matches expected frontend values ('active', 'expiring_soon', 'expired')
    }))
  );

  return certsWithEmployee;
}
}
