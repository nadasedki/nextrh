export declare class PasswordResetToken {
    id: number;
    token_hash: string;
    user_id: number;
    expires_at: Date;
    used: boolean;
    created_at: Date;
}
