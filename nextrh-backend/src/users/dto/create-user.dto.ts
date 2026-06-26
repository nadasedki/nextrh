import { IsNumber } from "class-validator";

export class CreateUserDto {
  email: string;
  password: string;
  full_name: string;
  role_id: number;
  department?: string;

}
