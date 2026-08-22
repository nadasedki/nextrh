import { IsEmail } from 'class-validator';

export class InviteMemberDto {
  @IsEmail({}, { message: 'Veuillez fournir un e-mail valide' })
  email: string;
}