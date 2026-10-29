import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PontoColeta } from './entities/ponto-coleta.entity';
import { CreatePontoColetaDto } from './dto/create-ponto-coleta.dto';

@Injectable()
export class PontosColetaService {
  constructor(
    @InjectRepository(PontoColeta)
    private readonly pontoColetaRepository: Repository<PontoColeta>,
  ) {}

  async create(createDto: CreatePontoColetaDto) {
    const novoPonto = this.pontoColetaRepository.create({
      nome: createDto.nome,
      tipo: createDto.tipo,
      bairro: createDto.bairro,
      endereco: createDto.endereco,
      lat: createDto.lat,
      lon: createDto.lon,
      status: 'ATIVO',
    });

    return this.pontoColetaRepository.save(novoPonto);
  }

  async findAll(apenasAtivos = false) {
    return this.pontoColetaRepository.find({
      where: apenasAtivos ? { status: 'ATIVO' } : {},
      order: {
        criado_em: 'DESC',
      },
    });
  }

  async softDelete(id: string) {
    const ponto = await this.pontoColetaRepository.findOne({
      where: { id },
    });

    if (!ponto) {
      throw new NotFoundException(
        'Ponto de coleta não encontrado',
      );
    }

    ponto.status = 'INATIVO';

    return this.pontoColetaRepository.save(ponto);
  }

  async reativar(id: string) {
    const ponto = await this.pontoColetaRepository.findOne({
      where: { id },
    });

    if (!ponto) {
      throw new NotFoundException(
        'Ponto de coleta não encontrado',
      );
    }

    ponto.status = 'ATIVO';

    return this.pontoColetaRepository.save(ponto);
  }

  async hardDelete(id: string) {
    const ponto = await this.pontoColetaRepository.findOne({
      where: { id },
    });

    if (!ponto) {
      throw new NotFoundException(
        'Ponto de coleta não encontrado',
      );
    }

    try {
      await this.pontoColetaRepository.delete(id);
    } catch (error) {
      if (error.driverError?.code === '23503') {
        throw new ConflictException('Este ponto possui pedidos vinculados. Desative-o para preservar o histórico.');
      }
      throw error;
    }

    return {
      message: 'Ponto de coleta removido permanentemente',
    };
  }
}
