import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn()
  team_id: number;

  @Column()
  team_name: string;

  @ManyToOne(() => User)
  team_leader: User;

  @Column({ nullable: true })
  team_leader_id: number;
  @ManyToMany(() => User, user => user.teams)
 @JoinTable({
  name: 'team_members',
  joinColumn: { name: 'team_id' },
  inverseJoinColumn: { name: 'user_id' },
})
members: User[];
}
