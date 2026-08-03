import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { Request } from 'express';

type AuthenticatedUser = {
  id: number;
  email: string;
  role: string;
};

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers.authorization;

    if (!token) {
      throw new UnauthorizedException('Kein Token bereitgestellt.');
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = AuthenticatedUser>(
    err: unknown,
    user: unknown,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (err || !isAuthenticatedUser(user)) {
      throw new UnauthorizedException('Ungültiges Token.');
    }

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    request.user = user; // 🔥 Muss gesetzt werden, damit RolesGuard funktioniert!

    return user as TUser;
  }
}

function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'number' &&
    typeof candidate.email === 'string' &&
    typeof candidate.role === 'string'
  );
}
