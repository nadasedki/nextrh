export class LoginDto {
  email: string;
  password: string;
  
  requestedRole: string; // <-- the role the user wants to log in as
}
