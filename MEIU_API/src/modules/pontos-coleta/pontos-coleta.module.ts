import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PontosColetaService } from './pontos-coleta.service';
import { PontosColetaController } from './pontos-coleta.controller';
import { PontoColeta } from './entities/ponto-coleta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PontoColeta])],
  controllers: [PontosColetaController],
  providers: [PontosColetaService],
  exports: [PontosColetaService],
})
export class PontosColetaModule {}