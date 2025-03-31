import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    console.log('✅ JwtAuthGuard wurde aufgerufen!');

    const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
    if (isPublic) {
      console.log('🔓 Route ist öffentlich – Authentifizierung wird übersprungen.');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;

    console.log('🔎 Request Headers:', JSON.stringify(request.headers, null, 2));
    console.log('🔑 Bearer Token erhalten:', token);

    if (!token) {
      console.error('🚨 Kein Token vorhanden!');
      throw new UnauthorizedException('Kein Token bereitgestellt.');
    }

    console.log('🔄 super.canActivate() wird jetzt aufgerufen...');
    const isActivated = super.canActivate(context);
    console.log('🔄 super.canActivate() Ergebnis:', isActivated);

    return isActivated;
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    this.logger.debug(`🔹 handleRequest() aufgerufen`);
    this.logger.debug(`🔹 Fehler: ${err?.message || 'Kein Fehler'}`);
    this.logger.debug(`🔹 Info: ${info?.message || 'Keine Info'}`);
    this.logger.debug(`🔹 Benutzer empfangen: ${JSON.stringify(user)}`);

    if (err || !user) {
      this.logger.error(`❌ Fehler oder kein Benutzer: ${err?.message || info?.message}`);
      throw new UnauthorizedException('Ungültiges Token.');
    }

    const request = context.switchToHttp().getRequest();
    request.user = user; // 🔥 Muss gesetzt werden, damit RolesGuard funktioniert!

    this.logger.debug(`✅ Benutzer erfolgreich authentifiziert: ${JSON.stringify(user)}`);
    return user;
  }
}
