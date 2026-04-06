import { IsInt } from 'class-validator';
export class AddMemberDto {
  @IsInt()
  team_id: number;
  @IsInt()
  user_id: number;
}
