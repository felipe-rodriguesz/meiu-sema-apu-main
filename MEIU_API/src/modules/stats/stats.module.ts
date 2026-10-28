import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { EstatisticasDescarte } from './entities/estatisticas-descarte.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EstatisticasDescarte])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
