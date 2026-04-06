import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  role_id: number;

  @Column({ type: 'enum', enum: ['EMPLOYEE','TEAM_LEADER','BID_MANAGER'], unique: true })
  role_name: string;
}
