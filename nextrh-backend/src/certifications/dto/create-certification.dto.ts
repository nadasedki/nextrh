import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateCertificationDto {
  @IsNotEmpty()
  @IsString()
  name: string; 

  @IsNotEmpty()
  @IsString()
  issuer: string; 
  @IsOptional()
  @IsDateString()
  issueDate?: string; 

  @IsOptional()
  @IsDateString()
  expirationDate?: string; 

  @IsOptional()
  @IsString()
  credentialId?: string;
  
  @IsOptional()
  status?: 'active' | 'expiring_soon' | 'expired';
  @IsOptional()
  @IsString()
  filePath?: string | null;
}