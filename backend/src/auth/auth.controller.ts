import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { SetPasswordDto } from './dto/set-password.dto';
import { UserPasswordService } from '../user/user-password.service';

@ApiTags('Auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userPasswordService: UserPasswordService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Benutzer einloggen' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@example.com' },
        password: { type: 'string', example: 'password123' },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Erfolgreicher Login',
    schema: { example: { access_token: 'jwt_token' } },
  })
  @ApiResponse({ status: 400, description: 'Fehlende Eingaben' })
  @ApiResponse({ status: 401, description: 'Ungültige Anmeldeinformationen' })
  async login(
    @Body() { email, password }: { email: string; password: string },
  ) {
    if (!email || !password) {
      throw new BadRequestException('E-Mail und Passwort sind erforderlich.');
    }
    return this.authService.login({ email, password });
  }

  @Public()
  @Post('password-reset/confirm')
  @ApiOperation({ summary: 'Passwort über einen Einmal-Link setzen' })
  @ApiResponse({ status: 200, description: 'Passwort wurde gesetzt.' })
  async setPassword(@Body() body: SetPasswordDto) {
    return this.userPasswordService.setPassword(body.token, body.password);
  }
}
