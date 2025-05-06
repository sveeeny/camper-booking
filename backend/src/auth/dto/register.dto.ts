import { IsEmail, IsString, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsIn(['admin', 'host'])
  role: 'admin' | 'host';
}
