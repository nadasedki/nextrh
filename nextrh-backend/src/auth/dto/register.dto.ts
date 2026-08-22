import { IsEmail, IsNotEmpty, IsString, MinLength, IsInt, IsPositive } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Veuillez fournir une adresse email valide' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password: string; 
  @IsString()
  @IsNotEmpty({ message: 'Le nom complet est requis' })
  full_name: string;

  @IsInt({ message: 'Le role_id doit être un nombre entier' })
  @IsPositive({ message: 'Le role_id doit être un nombre positif' })
  role_id: number;
}