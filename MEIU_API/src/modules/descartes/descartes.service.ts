import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Descarte } from './entities/descarte.entity';
import { CreateDescarteDto } from './dto/create-descarte.dto';
import { PontoColeta } from '../pontos-coleta/entities/ponto-coleta.entity';

@Injectable()
export class DescartesService {
  constructor(
    @InjectRepository(Descarte)
    private readonly descarteRepository: Repository<Descarte>,

    @InjectRepository(PontoColeta)
    private readonly pontoColetaRepository: Repository<PontoColeta>,
  ) {}

  async create(createDescarteDto: CreateDescarteDto) {
    const protocolo = this.generateProtocol('TX');

    if (createDescarteDto.ponto_coleta_id) {
      const pontoExiste = await this.pontoColetaRepository.findOne({
        where: {
          id: createDescarteDto.ponto_coleta_id,
        },
      });

      if (!pontoExiste) {
        throw new BadRequestException(
          'Ponto de coleta informado não existe',
        );
      }

      if (pontoExiste.status === 'INATIVO') {
        throw new BadRequestException(
          'Ponto de coleta informado está inativo',
        );
      }
    }

    const newDescarte = this.descarteRepository.create({
      protocolo,
      eh_mistura: createDescarteDto.eh_mistura,
      residuo_principal: createDescarteDto.residuo_principal,
      quantidade_kg: createDescarteDto.quantidade_kg,
      frequencia_dias: createDescarteDto.frequencia_dias,
      material: createDescarteDto.material,
      estado_material: createDescarteDto.estado_material,
      tipo_tecido: createDescarteDto.tipo_tecido,
      lat: createDescarteDto.lat,
      lon: createDescarteDto.lon,
      ponto_coleta_id: createDescarteDto.ponto_coleta_id,
      situacao: 'PENDENTE',
    });

    const saved = await this.descarteRepository.save(newDescarte);

    return {
      protocolo: saved.protocolo,
      status: 'success',
      ponto_coleta_id: saved.ponto_coleta_id,
    };
  }

  async findAll() {
    return this.descarteRepository.find({
      relations: {
        ponto_coleta: true,
      },
      order: {
        criado_em: 'DESC',
      },
    });
  }

  private generateProtocol(prefix: string): string {
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    const day = String(new Date().getDate()).padStart(2, '0');

    return `${prefix}-${day}${rand}`;
  }
}