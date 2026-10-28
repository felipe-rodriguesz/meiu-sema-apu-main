import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstatisticasDescarte } from './entities/estatisticas-descarte.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(EstatisticasDescarte)
    private readonly statsRepository: Repository<EstatisticasDescarte>,
  ) {}

  async getLatestStats() {
    const stats = await this.statsRepository.find({
      order: { data_atualizacao: 'DESC' },
      take: 1,
    });

    if (stats.length > 0) {
      return stats[0];
    }

    return {
      total_registros: 0,
      total_kg: 0,
      residuo_mais_comum: 'Nenhum',
      data_atualizacao: new Date().toISOString().split('T')[0],
    };
  }
}
