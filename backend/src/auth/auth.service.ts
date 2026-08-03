import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Ungültige E-Mail oder Passwort.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Ungültige E-Mail oder Passwort.');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async login(user: { email: string; password: string }) {
    if (!user.email || !user.password) {
      throw new BadRequestException('E-Mail und Passwort sind erforderlich.');
    }

    const foundUser = await this.userService.findUserByEmail(user.email);
    if (!foundUser) {
      throw new UnauthorizedException('Ungültige E-Mail oder Passwort.');
    }

    const isPasswordValid = await bcrypt.compare(
      user.password,
      foundUser.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Ungültige E-Mail oder Passwort.');
    }

    const payload = {
      email: foundUser.email,
      sub: foundUser.id,
      role: foundUser.role,
    };
    const token = this.jwtService.sign(payload);

    return { access_token: token };
  }

  async register(email: string, password: string, role: 'admin' | 'host') {
    if (!email || !password || !role) {
      throw new BadRequestException(
        'E-Mail, Passwort und Rolle sind erforderlich.',
      );
    }

    const existingUser = await this.userService.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException(
        'Ein Benutzer mit dieser E-Mail existiert bereits.',
      );
    }

    return this.userService.createUser(email, password, role);
  }
}
