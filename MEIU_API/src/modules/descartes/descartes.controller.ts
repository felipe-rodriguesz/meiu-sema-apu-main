import { Controller, Get, Post, Body } from '@nestjs/common';
import { DescartesService } from './descartes.service';
import { CreateDescarteDto } from './dto/create-descarte.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('descartes')
@Controller('descartes')
export class DescartesController {
  constructor(private readonly descartesService: DescartesService) {}

  @Post()
  @ApiOperation({ summary: 'Registra um novo descarte' })
  create(@Body() createDescarteDto: CreateDescarteDto) {
    return this.descartesService.create(createDescarteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os descartes (Admin)' })
  findAll() {
    return this.descartesService.findAll();
  }
}
