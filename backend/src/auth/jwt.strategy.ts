import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { email: string; sub: number; role: string }) {
    console.log('🔥 JwtStrategy.validate() wurde aufgerufen!');
    console.log('✅ JWT Payload:', payload);

    if (!payload || !payload.sub || !payload.email || !payload.role) {
      console.error('❌ Fehler: Ungültiges Token-Payload!');
      throw new UnauthorizedException('Token ist ungültig.');
    }

    const user = { id: payload.sub, email: payload.email, role: payload.role };
    console.log('🚀 validate() gibt zurück:', JSON.stringify(user));
    return user;
}

  
}
