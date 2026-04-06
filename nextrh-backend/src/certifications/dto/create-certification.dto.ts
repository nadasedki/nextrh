import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateCertificationDto {
  @IsNotEmpty()
  @IsString()
  name: string; // Frontend sends 'name'

  @IsNotEmpty()
  @IsString()
  issuer: string; // Frontend sends 'issuer'

  @IsOptional()
  @IsDateString()
  issueDate?: string; // Frontend sends 'issueDate'

  @IsOptional()
  @IsDateString()
  expirationDate?: string; // Frontend sends 'expirationDate'

  @IsOptional()
  @IsString()
  credentialId?: string;
  
  @IsOptional()
  status?: 'active' | 'expiring_soon' | 'expired';
  @IsOptional()
  @IsString()
  filePath?: string | null;
}