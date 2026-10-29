import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, Req, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { DescartesService } from './descartes.service';
import { RecebimentosService } from './recebimentos.service';
import { CreateDescarteDto } from './dto/create-descarte.dto';
import { CorrigirRecebimentoDto, RecebimentoDto } from './dto/recebimento.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('descartes')
@Controller('descartes')
export class DescartesController {
  constructor(private readonly descartes: DescartesService, private readonly recebimentos: RecebimentosService) {}

  @Public() @Post()
  @ApiOperation({ summary: 'Registra um descarte sem aprovação prévia.' })
  create(@Body() dto: CreateDescarteDto) { return this.descartes.create(dto); }

  @ApiBearerAuth() @Get()
  findAll() { return this.descartes.findAll(); }

  @ApiBearerAuth() @Get('protocolo/:protocolo')
  findByProtocol(@Param('protocolo') protocolo: string) { return this.recebimentos.findByProtocol(protocolo); }

  @ApiBearerAuth() @Post(':id/recebimento') @HttpCode(200)
  receive(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RecebimentoDto,
    @Req() req: Request & { user: { id: string } }) {
    return this.recebimentos.receive(id, dto, req.user.id);
  }

  @ApiBearerAuth() @Patch(':id/recebimento')
  correct(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CorrigirRecebimentoDto,
    @Req() req: Request & { user: { id: string } }) {
    return this.recebimentos.correct(id, dto, req.user.id);
  }
}
