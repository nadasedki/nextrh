import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string; // Frontend sends 'name'

  @IsString()
  @IsOptional()
  client: string; // Frontend sends 'client'

  @IsString()
  @IsOptional()
  role: string; // Frontend sends 'role'

  @IsString()
  @IsOptional()
  description: string; // Frontend sends 'description'

  @IsDateString()
  @IsOptional()
  startDate: string; // Frontend sends 'startDate'

  @IsDateString()
  @IsOptional()
  endDate: string; // Frontend sends 'endDate'

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  technologies: string[]; // Frontend sends 'technologies' (as an array)
}