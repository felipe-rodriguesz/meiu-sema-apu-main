import { Injectable, UnauthorizedException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { AdminSemaService } from '../../administradores/admin-sema.service';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { sessionToken } from '../session-cookie';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService, private readonly admins: AdminSemaService) {
    super({
      jwtFromRequest: (request: Request) => sessionToken(request, configService.get('NODE_ENV') === 'production'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: { sub: string; email: string }) {
    if (!payload || !isUUID(payload.sub)) throw new UnauthorizedException();
    const admin = await this.admins.findById(payload.sub);
    if (!admin) throw new UnauthorizedException('Usuário não está mais autorizado.');
    return {
      id: admin.id,
      email: admin.email,
      nome: admin.nome,
    };
  }
}
