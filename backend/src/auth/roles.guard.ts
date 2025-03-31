import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    console.log('✅ RolesGuard wurde aufgerufen!');

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Kein Rollen-Check nötig
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    this.logger.debug(`🔍 User aus Request: ${JSON.stringify(user)}`);
    this.logger.debug(`🔍 Benötigte Rollen: ${JSON.stringify(requiredRoles)}`);

    if (!user) {
      this.logger.error('❌ Kein User im Request gefunden!');
      this.logger.error('📌 Request Headers:', JSON.stringify(request.headers));
      this.logger.error('📌 Request Body:', JSON.stringify(request.body));
      throw new ForbiddenException('🚫 Zugriff verweigert. Kein Benutzer gefunden.');
    }

    if (!requiredRoles.includes(user.role)) {
      this.logger.warn(`🚫 Zugriff verweigert für ${user.email} mit Rolle: ${user.role}`);
      throw new ForbiddenException('🚫 Zugriff verweigert. Unzureichende Berechtigungen.');
    }

    return true;
  }
}
