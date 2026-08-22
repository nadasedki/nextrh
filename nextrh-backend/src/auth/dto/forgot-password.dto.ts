import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Veuillez fournir une adresse email valide' })
  email: string;
}