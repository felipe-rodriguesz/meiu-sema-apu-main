import { Controller, Get } from '@nestjs/common';
import { NoticiasService } from './noticias.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';

@ApiTags('noticias')
@Controller('noticias')
export class NoticiasController {
  constructor(private readonly noticiasService: NoticiasService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtém a lista de notícias e vitrine social' })
  findAll() {
    return this.noticiasService.findAll();
  }
}
