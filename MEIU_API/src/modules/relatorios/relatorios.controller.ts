import { Controller, Get, Header, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { FiltroRelatorioDto } from './filtro-relatorio.dto';
import { RelatoriosService } from './relatorios.service';

@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly service: RelatoriosService) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  consultar(@Query() filtro: FiltroRelatorioDto) { return this.service.consultar(filtro); }
  @Get('csv')
  async csv(@Query() filtro: FiltroRelatorioDto, @Res() res: Response) {
    const content = await this.service.csv(filtro);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-residuos.csv"');
    res.setHeader('Cache-Control', 'no-store');
    res.send(content);
  }
}
