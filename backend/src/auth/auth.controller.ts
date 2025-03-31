import { 
  Controller, 
  Post, 
  Body, 
  BadRequestException, 
  UseGuards
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiBody, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RegisterDto } from './dto/register.dto'; // 👈 Stelle sicher, dass das DTO existiert!

@ApiTags('Auth') // Gruppiert Endpunkte unter "Auth" in Swagger
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  
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
    schema: { 
      example: { access_token: 'jwt_token' } 
    } 
  })
  @ApiResponse({ status: 400, description: 'Fehlende Eingaben' })
  @ApiResponse({ status: 401, description: 'Ungültige Anmeldeinformationen' })
  async login(@Body() { email, password }: { email: string; password: string }) {
    if (!email || !password) {
      throw new BadRequestException('E-Mail und Passwort sind erforderlich.');
    }
    return this.authService.login({ email, password });
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')  // 👈 Nur Admins dürfen neue User erstellen!
  @ApiOperation({ summary: 'Neuen Benutzer registrieren' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'newuser@example.com' },
        password: { type: 'string', example: 'securepassword' },
        role: { type: 'string', enum: ['admin', 'host'], example: 'host' },
      },
      required: ['email', 'password', 'role'],
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Erfolgreiche Registrierung', 
    schema: { 
      example: { id: 1, email: 'newuser@example.com', role: 'host' } 
    } 
  })
  @ApiResponse({ status: 400, description: 'Ungültige Eingaben oder E-Mail bereits registriert' })
  async register(@Body() { email, password, role }: RegisterDto) {
    return this.authService.register(email, password, role);  // ✅ Jetzt bekommt es 3 Argumente!
  }
  
}
