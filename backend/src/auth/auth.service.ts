import { 
    Injectable, 
    UnauthorizedException, 
    NotFoundException, 
    ConflictException, 
    BadRequestException 
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private userService: UserService, private jwtService: JwtService) {}

    async validateUser(email: string, password: string): Promise<any> {
        console.log('🔍 Login-Versuch mit:', email);
        
        const user = await this.userService.findUserByEmail(email);
        if (!user) {
            console.log('❌ Kein Benutzer mit dieser E-Mail gefunden!');
            throw new UnauthorizedException('Ungültige E-Mail oder Passwort.');
        }

        console.log('✅ Benutzer gefunden:', user.email);

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            console.log('❌ Falsches Passwort!');
            throw new UnauthorizedException('Ungültige E-Mail oder Passwort.');
        }

        console.log('✅ Passwort korrekt!');
        const { passwordHash, ...result } = user;
        return result;
    }

    async login(user: { email: string; password: string }) {
        console.log('🔐 Login-Prozess gestartet für:', user.email);

        if (!user.email || !user.password) {
            throw new BadRequestException('E-Mail und Passwort sind erforderlich.');
        }

        const foundUser = await this.userService.findUserByEmail(user.email);
        if (!foundUser) {
            console.log('❌ Benutzer nicht gefunden!');
            throw new UnauthorizedException('Ungültige E-Mail oder Passwort.');
        }

        console.log('✅ Benutzer existiert in der DB');

        const isPasswordValid = await bcrypt.compare(user.password, foundUser.passwordHash);
        if (!isPasswordValid) {
            console.log('❌ Passwort ungültig!');
            throw new UnauthorizedException('Ungültige E-Mail oder Passwort.');
        }

        console.log('✅ Passwort ist korrekt! Token wird generiert...');
        
        const payload = { email: foundUser.email, sub: foundUser.id, role: foundUser.role };
        const token = this.jwtService.sign(payload);

        console.log('✅ Token erstellt:', token);

        return { access_token: token };
    }

    async register(email: string, password: string, role: 'admin' | 'host') {
        console.log('📝 Registrierung gestartet für:', email);

        if (!email || !password || !role) {
            throw new BadRequestException('E-Mail, Passwort und Rolle sind erforderlich.');
        }

        const existingUser = await this.userService.findUserByEmail(email);
        if (existingUser) {
            throw new ConflictException('Ein Benutzer mit dieser E-Mail existiert bereits.');
        }

        return this.userService.createUser(email, password, role);
    }
}
