import { User } from '../../users/entities/user.entity';
export declare class Training {
    training_id: number;
    user_id: number;
    training_name: string;
    provider: string;
    description?: string;
    completion_date?: string;
    duration?: string;
    user?: User;
}
