export declare class CreateCertificationDto {
    name: string;
    issuer: string;
    issueDate?: string;
    expirationDate?: string;
    credentialId?: string;
    status?: 'active' | 'expiring_soon' | 'expired';
    filePath?: string | null;
}
