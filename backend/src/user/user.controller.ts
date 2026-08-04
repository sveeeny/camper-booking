import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { InviteUserDto } from './dto/invite-user.dto';
import { UserPasswordService } from './user-password.service';
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userPasswordService: UserPasswordService,
  ) {}

  @Post('invite')
  @Roles('admin')
  @ApiOperation({ summary: 'Benutzer anlegen und per E-Mail einladen' })
  @ApiResponse({
    status: 201,
    description: 'Benutzer wurde erstellt und die Einladung versendet.',
  })
  async inviteUser(@Body() body: InviteUserDto) {
    return this.userPasswordService.inviteUser(body.email, body.role);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Alle Benutzer abrufen' })
  @ApiResponse({
    status: 200,
    description: 'Liste aller Benutzer wird zurückgegeben.',
  })
  async getUsers() {
    return this.userService.getAllUsers();
  }

  @Post(':id/password-reset')
  @Roles('admin')
  @ApiOperation({ summary: 'Link zum Setzen des Passworts senden' })
  @ApiResponse({
    status: 201,
    description: 'Reset-Link wurde per E-Mail versendet.',
  })
  async sendPasswordReset(@Param('id', ParseIntPipe) id: number) {
    return this.userPasswordService.sendPasswordLink(id);
  }

  @Delete(':id')
  @Roles('admin')
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
