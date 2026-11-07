import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
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
    this.validar(createDto);
    const novoPonto = this.pontoColetaRepository.create({
      ...this.campos(createDto),
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

  private validar(dto: CreatePontoColetaDto) {
    if (dto.horarios_semana?.some(h => h.inicio >= h.fim)) {
      throw new BadRequestException('Em cada dia, o fim do atendimento deve ser posterior ao início, no mesmo dia.');
    }
    if ((dto.lat == null) !== (dto.lon == null)) throw new BadRequestException('Informe as duas coordenadas ou deixe ambas ausentes.');
    if (dto.data_inicio && dto.data_fim && dto.data_inicio > dto.data_fim) throw new BadRequestException('Data inicial deve ser anterior ou igual à final.');
    if (Boolean(dto.horario_inicio) !== Boolean(dto.horario_fim)) throw new BadRequestException('Informe os dois horários.');
    if (dto.horario_inicio && dto.horario_inicio >= dto.horario_fim) throw new BadRequestException('Horário final deve ser posterior ao inicial, no mesmo dia.');
  }

  private campos(dto: CreatePontoColetaDto) {
    const horarios = dto.horarios_semana ?? (dto.dias_semana || []).map(dia => ({
      dia, inicio: dto.horario_inicio || null, fim: dto.horario_fim || null,
    }));
    const materiais = dto.materiais_lista ?? (dto.materiais_aceitos?.trim() ? [dto.materiais_aceitos.trim()] : []);
    return { ...dto, horarios_semana: [...horarios].sort((a,b) => a.dia - b.dia),
      materiais_lista: materiais, dias_semana: horarios.map(h => h.dia).sort(),
      data_inicio: dto.data_inicio || null, data_fim: dto.data_fim || null,
      horario_inicio: dto.horario_inicio || null, horario_fim: dto.horario_fim || null,
      materiais_aceitos: materiais.length ? materiais.join('; ') : null,
      limite_kg_por_pedido: dto.limite_kg_por_pedido ?? null,
      orientacoes: dto.orientacoes?.trim() || null,
      bairro: dto.bairro?.trim() || null, endereco: dto.endereco?.trim() || null,
      lat: dto.lat ?? null, lon: dto.lon ?? null,
    };
  }

  async update(id: string, dto: CreatePontoColetaDto) {
    this.validar(dto);
    return this.pontoColetaRepository.manager.transaction(async manager => {
      const ponto = await manager.findOne(PontoColeta, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!ponto) throw new NotFoundException('Ponto de coleta não encontrado.');
      Object.assign(ponto, this.campos(dto));
      return manager.save(ponto);
    });
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
