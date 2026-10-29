import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import { Descarte } from './entities/descarte.entity';
import { CreateDescarteDto } from './dto/create-descarte.dto';
import { PontoColeta } from '../pontos-coleta/entities/ponto-coleta.entity';

@Injectable()
export class DescartesService {
  constructor(@InjectRepository(Descarte) private readonly descarteRepository: Repository<Descarte>) {}

  async create(dto: CreateDescarteDto) {
    if ((dto.lat == null) !== (dto.lon == null)) throw new BadRequestException('Informe latitude e longitude juntas ou deixe ambas ausentes.');
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.descarteRepository.manager.transaction(async manager => {
          const ponto = await manager.findOne(PontoColeta, {
            where: { id: dto.ponto_coleta_id }, lock: { mode: 'pessimistic_read' },
          });
          if (!ponto || ponto.status !== 'ATIVO') throw new BadRequestException('Selecione um ponto de coleta existente e ativo.');
          const saved = await manager.save(Descarte, manager.create(Descarte, {
            ...dto, protocolo: 'TX-' + randomBytes(8).toString('hex').toUpperCase(), situacao: 'PENDENTE',
          }));
          return { protocolo: saved.protocolo, status: 'success', ponto_coleta_id: saved.ponto_coleta_id };
        });
      } catch (error) {
        if (error.driverError?.code !== '23505') throw error;
      }
    }
    throw new ServiceUnavailableException('Não foi possível gerar o protocolo. Tente novamente.');
  }

  findAll() {
    return this.descarteRepository.find({ relations: { ponto_coleta: true }, order: { criado_em: 'DESC' } });
  }
}
