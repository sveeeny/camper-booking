import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard, RolesGuard) // ✅ Auth & Rollen-Guard aktiv
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin') // ✅ Nur Admins dürfen neue Benutzer erstellen
  @ApiOperation({ summary: 'Neuen Benutzer registrieren' })
  @ApiResponse({
    status: 201,
    description: 'Benutzer wurde erfolgreich erstellt.',
  })
  async register(@Body() body: RegisterDto) {
    return this.userService.createUser(body.email, body.password, body.role);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard) // ⬅ Direkt auf die Methode setzen!
  @Roles('admin')
  @ApiOperation({ summary: 'Alle Benutzer abrufen' })
  @ApiResponse({
    status: 200,
    description: 'Liste aller Benutzer wird zurückgegeben.',
  })
  async getUsers() {
    return this.userService.getAllUsers();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Benutzerdaten aktualisieren' })
  @ApiResponse({
    status: 200,
    description: 'Benutzerdaten wurden aktualisiert.',
  })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, body.email, body.password);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin') // ✅ Nur Admins dürfen Benutzer löschen
  @ApiOperation({ summary: 'Benutzer löschen (nur Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Benutzer wurde erfolgreich gelöscht.',
  })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    const requestingUser = req.user;

    if (requestingUser.id === id) {
      throw new ForbiddenException(
        'Du kannst dein eigenes Konto nicht löschen.',
      );
    }

    const userToDelete = await this.userService.getUserById(id);
    if (!userToDelete) {
      throw new NotFoundException('Benutzer nicht gefunden.');
    }

    return this.userService.deleteUser(id);
  }
}
