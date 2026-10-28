import { Controller, Get } from '@nestjs/common';
import { NoticiasService } from './noticias.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('noticias')
@Controller('noticias')
export class NoticiasController {
  constructor(private readonly noticiasService: NoticiasService) {}

  @Get()
  @ApiOperation({ summary: 'Obtém a lista de notícias e vitrine social' })
  findAll() {
    return this.noticiasService.findAll();
  }
}
