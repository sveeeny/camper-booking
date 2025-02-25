import { Controller, Post, Body, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string }) {  // 👈 `username` entfernt
    return this.userService.createUser(body.email, body.password);
  }

  @Get()
  async getUsers() {
    return this.userService.getAllUsers();
  }
}
