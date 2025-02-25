import { Controller, Post, Body, Request, UseGuards, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {
    Logger.log('✅ AuthController wurde geladen!', 'AuthController');
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    Logger.log('🔍 Login-Route aufgerufen!', 'AuthController');
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(
    @Body() { email, password, role }: { email: string; password: string; role: 'admin' | 'host' },
  ) {
    Logger.log(`📩 Registrierung mit E-Mail: ${email}`, 'AuthController');
    return this.authService.register(email, password, role);
  }
}
