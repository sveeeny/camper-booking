import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import type { Repository } from 'typeorm';
import type { ResendService } from '../resend/resend.service';
import { User } from './user.entity';
import { UserPasswordService } from './user-password.service';
import type { UserService } from './user.service';

describe('UserPasswordService', () => {
  let repository: jest.Mocked<
    Pick<Repository<User>, 'findOne' | 'save' | 'update'>
  >;
  let userService: jest.Mocked<Pick<UserService, 'createUser' | 'deleteUser'>>;
  let resendService: jest.Mocked<Pick<ResendService, 'sendPasswordSetup'>>;
  let configService: Pick<ConfigService, 'getOrThrow'>;
  let service: UserPasswordService;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    userService = {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    };
    resendService = {
      sendPasswordSetup: jest.fn(),
    };
    configService = {
      getOrThrow: jest.fn().mockReturnValue('http://localhost/'),
    };
    service = new UserPasswordService(
      repository as unknown as Repository<User>,
      userService as unknown as UserService,
      resendService as unknown as ResendService,
      configService as ConfigService,
    );
  });

  it('stores only a hash of the one-time token and emails the raw token', async () => {
    const user = {
      id: 7,
      email: 'host@example.com',
      passwordHash: 'existing-hash',
      role: 'host',
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    } as User;
    repository.findOne.mockResolvedValue(user);
    repository.save.mockImplementation((input) =>
      Promise.resolve(input as User),
    );
    resendService.sendPasswordSetup.mockResolvedValue(undefined);

    await service.sendPasswordLink(7);

    const passwordUrl = resendService.sendPasswordSetup.mock.calls[0][1];
    const token = new URL(passwordUrl).searchParams.get('token');
    expect(token).toBeTruthy();
    expect(user.passwordResetTokenHash).toBe(
      createHash('sha256')
        .update(token as string)
        .digest('hex'),
    );
    expect(user.passwordResetTokenHash).not.toBe(token);
    expect(user.passwordResetExpiresAt?.getTime()).toBeGreaterThan(Date.now());
    expect(resendService.sendPasswordSetup).toHaveBeenCalledWith(
      'host@example.com',
      expect.stringMatching(
        /^http:\/\/localhost\/passwort-setzen\?token=[A-Za-z0-9_-]+$/,
      ),
      false,
      expect.stringMatching(/^password-setup-7-[a-f0-9]{64}$/),
    );
  });

  it('sets a hashed password and consumes the token', async () => {
    const token = 'one-time-token';
    repository.update.mockResolvedValue({
      affected: 1,
      raw: [],
      generatedMaps: [],
    });

    await service.setPassword(token, 'new-secure-password');

    const [, update] = repository.update.mock.calls[0];
    await expect(
      bcrypt.compare('new-secure-password', update.passwordHash as string),
    ).resolves.toBe(true);
    expect(update.passwordResetTokenHash).toBeNull();
    expect(update.passwordResetExpiresAt).toBeNull();
  });

  it('rejects an expired token without changing the password', async () => {
    repository.update.mockResolvedValue({
      affected: 0,
      raw: [],
      generatedMaps: [],
    });

    await expect(
      service.setPassword('expired-token', 'new-password'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates invited users without an admin-selected password', async () => {
    userService.createUser.mockResolvedValue({
      id: 10,
      email: 'new@example.com',
      role: 'host',
    });
    repository.findOne.mockResolvedValue({
      id: 10,
      email: 'new@example.com',
      passwordHash: 'unusable-hash',
      role: 'host',
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    } as User);
    repository.save.mockImplementation((input) =>
      Promise.resolve(input as User),
    );
    resendService.sendPasswordSetup.mockResolvedValue(undefined);

    await service.inviteUser('new@example.com', 'host');

    expect(userService.createUser).toHaveBeenCalledWith(
      'new@example.com',
      expect.stringMatching(/^[A-Za-z0-9_-]{64}$/),
      'host',
    );
    expect(resendService.sendPasswordSetup).toHaveBeenCalledWith(
      'new@example.com',
      expect.any(String),
      true,
      expect.any(String),
    );
  });
});
