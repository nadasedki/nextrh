import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  Inject,
  forwardRef  
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service'; 
import { AuthService } from '../auth/auth.service';   
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService, 
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,   
  ) {}
  /**
   * Invites and adds a member to a manager's team by email securely
   */
  async addMemberByEmail(leaderId: number, email: string) {
    // 1. Locate the leader's team and load existing members for duplicate checking
    const team = await this.teamRepo.findOne({
      where: { team_leader_id: leaderId },
      relations: ['members'],
    });
    if (!team) throw new NotFoundException('No team found for this Team Leader');

    // 2. Fetch the user from the database
    let user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // SCENARIO A: User does not exist -> Create them with standard employee defaults
      const tempPassword = uuidv4(); // Unguessable random placeholder password
      user = await this.usersService.create({
        email,
        full_name: email.split('@')[0], // Fallback name
        password: tempPassword,
        role_id: 1, // Standard employee role code
      });

      // Trigger a secure, passwordless setup link via our existing auth flow
      await this.authService.forgotPassword({ email });

      // Re-fetch the newly created user to ensure relations (like role) are loaded for safety
      user = await this.usersService.findByEmail(email);
    } else {
      // SCENARIO B: User already exists -> Enforce that they must be an Employee
      const isEmployee = user.role?.role_name === 'EMPLOYEE'; 
      
      if (!isEmployee) {
        throw new BadRequestException(
          `This user already exists but has the "${user.role?.role_name || 'Other'}" role. Only users with the "EMPLOYEE" role can be added to a team.`
        );
      }
    }

    // 3. Safe Duplicate Check
    const isAlreadyMember = team.members.some(member => member.user_id === user.user_id);
    if (isAlreadyMember) {
      throw new BadRequestException('This user is already a member of your team');
    }

    // 4. High Performance Relation Insert
    await this.teamRepo.createQueryBuilder()
      .relation(Team, 'members')
      .of(team.team_id)
      .add(user.user_id);

    return { 
      message: 'Collaborator added to the team successfully', 
      user_id: user.user_id 
    };
  }
/**
   *code correct a returner  Invites and adds a member to a manager's team by email securely
   */
  /*async addMemberByEmail(leaderId: number, email: string) {
    // 1. Locate the leader's team and load existing members for duplicate checking
    const team = await this.teamRepo.findOne({
      where: { team_leader_id: leaderId },
      relations: ['members'], // Safely loads members
    });
    if (!team) throw new NotFoundException('Aucune équipe trouvée pour ce Team Leader');

    // 2. Fetch or provision the user
    let user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Create user with standard defaults and blank/random initial credentials securely
      const tempPassword = uuidv4(); // Unguessable random placeholder password
      user = await this.usersService.create({
        email,
        full_name: email.split('@')[0], // Fallback name
        password: tempPassword,
        role_id: 1, // Standard employee role code
      });

      // 3. Trigger a secure, passwordless setup link via our existing auth flow
      await this.authService.forgotPassword({ email });
    }

    // 4. Safe Duplicate Check using the loaded members array
    const isAlreadyMember = team.members.some(member => member.user_id === user.user_id);
    if (isAlreadyMember) {
      throw new BadRequestException('Cet utilisateur appartient déjà à votre équipe');
    }

    // 5. High Performance Relation Insert (Keeps database writes fast)
    await this.teamRepo.createQueryBuilder()
      .relation(Team, 'members')
      .of(team.team_id)
      .add(user.user_id);

    return { 
      message: 'Collaborateur invité et ajouté à l\'équipe avec succès', 
      user_id: user.user_id 
    };
  }*/

  /**
   * High performance database removal
   */
  async removeMemberFromLeaderTeam(leaderId: number, memberId: number) {
    const team = await this.teamRepo.findOne({
      where: { team_leader_id: leaderId },
    });
    if (!team) throw new NotFoundException('Aucune équipe trouvée pour ce Team Leader');

    await this.teamRepo.createQueryBuilder()
      .relation(Team, 'members')
      .of(team.team_id)
      .remove(memberId);

    return { message: 'Collaborateur retiré de l\'équipe avec succès' };
  }

  // Create a new team
  create(dto: { team_name: string; team_leader_id: number }) {
    const team = this.teamRepo.create(dto);
    return this.teamRepo.save(team);
  }

  // Get all teams
  findAll() {
    return this.teamRepo.find({
      relations: ['members', 'members.role'],
    });
  }

 /**
   * Get the team of a specific leader (Self-Healing Lazy Initialization)
   */
  async getMyTeam(leaderId: number) {
    let team = await this.teamRepo.findOne({
      where: { team_leader_id: leaderId },
      relations: [
        'members',
        'members.role',
        'members.certifications'
      ],
    });

    // If no team exists, we automatically initialize one for the leader
    if (!team) {
      const leader = await this.userRepo.findOne({ where: { user_id: leaderId } });
      if (!leader) throw new NotFoundException('Chef d\'équipe non trouvé');

      team = this.teamRepo.create({
        team_name: `Équipe de ${leader.full_name}`,
        team_leader_id: leaderId,
      });
      await this.teamRepo.save(team);
      
      // Initialize empty array properties so the return object has the correct shape
      team.members = [];
    }

    return team;
  }

  // Get team by ID
  async findOne(id: number) {
    const team = await this.teamRepo.findOne({
      where: { team_id: id },
      relations: ['members', 'members.role'],
    });

    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async findMembersByManager(managerId: number) {
    const team = await this.getMyTeam(managerId);

    return team.members.filter(member => member.active !== false) 
    .map(member => ({
      id: member.user_id,
      name: member.full_name,
      email: member.email,
      title: member.title || 'N/A',
      yearsOfExperience: member.years_of_experience || 0,
      certifications: member.certifications || [], 
    }));
  }

  /**
   * Calculates team stats dynamically (reusing self-healing logic)
   */

 async calculateTeamStats(leaderId: number) {
    const team = await this.getMyTeam(leaderId); // Safe lazy-load: creates team if missing

    // 1. Filter out deactivated members so they don't count towards metrics [1]
    const members = (team.members || []).filter(member => member.active !== false); 
    const allCerts = members.flatMap(m => m.certifications || []);

    // 2. Calculate Certificate status metrics
    const certStats = {
      active: allCerts.filter(c => c.status === 'active').length,
      expiringSoon: allCerts.filter(c => c.status === 'expiring_soon').length,
      expired: allCerts.filter(c => c.status === 'expired').length,
    };

    // 3. Group by Provider
    const providerStats = allCerts.reduce((acc, cert) => {
      acc[cert.provider] = (acc[cert.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 4. Sort and get top 5 providers
    const topProviders = Object.entries(providerStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 5. Get top 5 upcoming expirations mapped to match frontend expectations
    const expiringCerts = allCerts
      .filter(c => c.status === 'expiring_soon')
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
      .slice(0, 5)
      .map(c => {
        const member = members.find(m => m.certifications.some(mc => mc.certId === c.certId));
        return {
          id: c.certId,
          name: c.certName,
          expiryDate: c.expiryDate instanceof Date ? c.expiryDate.toISOString() : c.expiryDate,
          provider: c.provider,
          employeeName: member?.full_name || 'Unknown'
        };
      });

    // 6. Return full statistics object (always populated, even if values are 0 or empty arrays)
    return {
      teamName: team.team_name,
      totalMembers: members.length,
      certStats,
      topProviders,
      expiringCerts,
    };
  }

  async findAllTeamCertifications(leaderId: number) {
    const team = await this.getMyTeam(leaderId);

    // 2. Only map certifications for ACTIVE members [1]
    return team.members
      .filter(member => member.active !== false) 
      .flatMap(member => 
        (member.certifications || []).map(cert => ({
          ...cert,
          employeeName: member.full_name,
          employeeTitle: member.title || 'N/A',
        }))
      );
  }
}