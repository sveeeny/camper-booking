import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getAllUsers(): Promise<Partial<User>[]> {
    const users = await this.userRepository.find();
    return users.map(({ id, email, role, createdAt, updatedAt }) => ({
      id,
      email,
      role,
      createdAt,
      updatedAt,
    })); // ✅ `passwordHash` wird ausgefiltert
  }

  async getUserById(id: number): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Benutzer mit ID ${id} nicht gefunden.`);
    }
    return { id: user.id, email: user.email, role: user.role };
  }

  async createUser(
    email: string,
    password: string,
    role: 'admin' | 'host' = 'host',
  ): Promise<Partial<User>> {
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      throw new BadRequestException('E-Mail und Passwort sind erforderlich.');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new ConflictException(
        'Ein Benutzer mit dieser E-Mail existiert bereits.',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email: normalizedEmail,
      passwordHash,
      role,
    });
    const savedUser = await this.userRepository.save(user);

    return { id: savedUser.id, email: savedUser.email, role: savedUser.role }; // ✅ Passwort wird nicht zurückgegeben
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Benutzer mit ID ${id} nicht gefunden.`);
    }

    await this.userRepository.delete(id);
    return { message: `Benutzer mit ID ${id} wurde erfolgreich gelöscht.` };
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('Ungültige E-Mail oder Passwort.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new NotFoundException('Ungültige E-Mail oder Passwort.');
    }

    return user;
  }
}
