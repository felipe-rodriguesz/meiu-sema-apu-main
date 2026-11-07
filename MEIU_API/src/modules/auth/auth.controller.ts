import { Body, Controller, Get, Header, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';
import { sessionCookieName, sessionCookieOptions } from './session-cookie';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly config: ConfigService) {}

  @Post('login')
  @Public()
  @Header('Cache-Control', 'no-store')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { access_token, usuario } = await this.authService.login(dto);
    const production = this.config.get('NODE_ENV') === 'production';
    response.cookie(sessionCookieName(production), access_token, sessionCookieOptions(production));
    return { usuario };
  }

  @Get('me')
  @Header('Cache-Control', 'no-store')
  me(@Req() request: Request & { user: { nome: string; email: string } }) {
    return { usuario: { nome: request.user.nome, email: request.user.email } };
  }

  @Post('logout')
  @Header('Cache-Control', 'no-store')
  logout(@Res({ passthrough: true }) response: Response) {
    const production = this.config.get('NODE_ENV') === 'production';
    response.clearCookie(sessionCookieName(production), {
      ...sessionCookieOptions(production),
      maxAge: undefined,
    });
    return { ok: true };
  }
}
