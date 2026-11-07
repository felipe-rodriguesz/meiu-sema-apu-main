import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';

import { PontosColetaService } from './pontos-coleta.service';
import { CreatePontoColetaDto } from './dto/create-ponto-coleta.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

@ApiTags('pontos-coleta')
@Controller('pontos-coleta')
export class PontosColetaController {
  constructor(
    private readonly pontosColetaService: PontosColetaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Cadastra um novo ponto de coleta' })
  create(@Body() createPontoColetaDto: CreatePontoColetaDto) {
    return this.pontosColetaService.create(createPontoColetaDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lista todos os pontos de coleta' })
  findAll() {
    return this.pontosColetaService.findAll(true);
  }

  @Get('admin')
  findAllAdmin() { return this.pontosColetaService.findAll(); }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreatePontoColetaDto) {
    return this.pontosColetaService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Inativa, reativa ou remove um ponto de coleta',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('tipo') tipo: 'soft' | 'hard' | 'reativar' = 'soft',
  ) {
    if (!['soft', 'hard', 'reativar'].includes(tipo)) throw new BadRequestException('Operação inválida.');
    if (tipo === 'hard') {
      return this.pontosColetaService.hardDelete(id);
    }

    if (tipo === 'reativar') {
      return this.pontosColetaService.reativar(id);
    }

    return this.pontosColetaService.softDelete(id);
  }
}
