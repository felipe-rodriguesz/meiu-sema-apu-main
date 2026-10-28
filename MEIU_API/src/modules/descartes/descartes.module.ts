import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DescartesService } from './descartes.service';
import { DescartesController } from './descartes.controller';
import { Descarte } from './entities/descarte.entity';
import { PontoColeta } from '../pontos-coleta/entities/ponto-coleta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Descarte, PontoColeta])],
  controllers: [DescartesController],
  providers: [DescartesService],
  exports: [DescartesService],
})
export class DescartesModule {}