import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';
import { AdminSemaService } from '../administradores/admin-sema.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly adminSemaService: AdminSemaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const admin = await this.adminSemaService.findByEmail(dto.email);

    if (!admin) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const senhaCorreta = await bcrypt.compare(dto.senha, admin.senhaHash);

    if (!senhaCorreta) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const payload = {
      sub: admin.id,
      email: admin.email,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      usuario: {
        nome: admin.nome,
        email: admin.email,
      },
    };
  }
}