import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { MoreThan, Repository } from 'typeorm';
import { ResendService } from '../resend/resend.service';
import { User } from './user.entity';
import { UserService } from './user.service';

const PASSWORD_LINK_LIFETIME_MS = 60 * 60 * 1000;

@Injectable()
export class UserPasswordService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly resendService: ResendService,
    private readonly configService: ConfigService,
  ) {}

  async inviteUser(
    email: string,
    role: 'admin' | 'host',
  ): Promise<Partial<User>> {
    const unusablePassword = randomBytes(48).toString('base64url');
    const user = await this.userService.createUser(
      email,
      unusablePassword,
      role,
    );

    if (!user.id) {
      throw new InternalServerErrorException(
        'Der Benutzer konnte nicht vollständig angelegt werden.',
      );
    }

    try {
      await this.sendPasswordLink(user.id, true);
    } catch (error) {
      await this.userService.deleteUser(user.id);
      throw error;
    }

    return user;
  }

  async sendPasswordLink(
    userId: number,
    isInvitation = false,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Benutzer mit ID ${userId} nicht gefunden.`);
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = new Date(
      Date.now() + PASSWORD_LINK_LIFETIME_MS,
    );
    await this.userRepository.save(user);

    const frontendUrl = this.configService
      .getOrThrow<string>('FRONTEND_URL')
      .replace(/\/+$/, '');
    const passwordUrl = `${frontendUrl}/passwort-setzen?token=${encodeURIComponent(token)}`;

    try {
      await this.resendService.sendPasswordSetup(
        user.email,
        passwordUrl,
        isInvitation,
        `password-setup-${user.id}-${tokenHash}`,
      );
    } catch (error) {
      user.passwordResetTokenHash = null;
      user.passwordResetExpiresAt = null;
      await this.userRepository.save(user);
      throw error;
    }

    return {
      message: isInvitation
        ? 'Einladung wurde per E-Mail versendet.'
        : 'Link zum Zurücksetzen wurde per E-Mail versendet.',
    };
  }

  async setPassword(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    const tokenHash = hashToken(token);
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await this.userRepository.update(
      {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: MoreThan(new Date()),
      },
      {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    );

    if (result.affected !== 1) {
      throw new BadRequestException('Der Link ist ungültig oder abgelaufen.');
    }

    return { message: 'Das Passwort wurde erfolgreich gesetzt.' };
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
