import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Veuillez fournir une adresse email valide' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Le rôle demandé est requis' })
  requestedRole: string;
}