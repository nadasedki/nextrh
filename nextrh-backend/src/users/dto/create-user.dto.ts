export class CreateUserDto {
  email: string;
  password: string;
  full_name: string;
  role_id: number;
  department?: string;
role_ids: number[]; // multiple roles
}
