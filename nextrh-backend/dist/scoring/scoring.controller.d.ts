import { ScoringService } from './scoring.service';
export declare class ScoringController {
    private readonly scoringService;
    constructor(scoringService: ScoringService);
    recalculateUserScore(userId: number): Promise<{
        message: string;
        userId: number;
        score: number;
    }>;
    getUserScore(userId: number): Promise<{
        userId: number;
        score: number;
    }>;
    getAllScores(): Promise<import("../users/entities/user.entity").User[]>;
}
