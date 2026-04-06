import { User } from './user.entity';
export declare class Team {
    team_id: number;
    team_name: string;
    team_leader: User;
    team_leader_id: number;
    members: User[];
}
