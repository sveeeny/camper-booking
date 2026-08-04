import { IsEmail, IsIn } from 'class-validator';

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsIn(['admin', 'host'])
  role: 'admin' | 'host';
}
