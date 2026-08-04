import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  let repository: jest.Mocked<
    Pick<Repository<User>, 'create' | 'find' | 'findOne' | 'save'>
  >;
  let service: UserService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    service = new UserService(repository as unknown as Repository<User>);
  });

  it('normalizes the email and never returns the password hash', async () => {
    repository.findOne.mockResolvedValue(null);
    repository.create.mockImplementation((input) => input as User);
    repository.save.mockImplementation((input) =>
      Promise.resolve({
        ...input,
        id: 42,
      } as User),
    );

    const result = await service.createUser(
      '  NEW.HOST@Example.COM  ',
      'secure-password',
      'host',
    );

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { email: 'new.host@example.com' },
    });
    const createdUser = repository.create.mock.calls[0][0] as User;
    expect(createdUser.email).toBe('new.host@example.com');
    expect(createdUser.role).toBe('host');
    expect(typeof createdUser.passwordHash).toBe('string');
    expect(result).toEqual({
      id: 42,
      email: 'new.host@example.com',
      role: 'host',
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('stores a hash instead of the new password', async () => {
    const user = {
      id: 7,
      email: 'host@example.com',
      passwordHash: 'old-hash',
      role: 'host',
    } as User;
    repository.findOne.mockResolvedValue(user);
    repository.save.mockImplementation((input) =>
      Promise.resolve(input as User),
    );

    await service.updateUser(7, undefined, 'another-secure-password');

    expect(repository.save).toHaveBeenCalledWith(user);
    expect(user.passwordHash).not.toBe('another-secure-password');
    await expect(
      bcrypt.compare('another-secure-password', user.passwordHash),
    ).resolves.toBe(true);
  });

  it('rejects an update without changes', async () => {
    await expect(service.updateUser(7)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.findOne).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });
});
