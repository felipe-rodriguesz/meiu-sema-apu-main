import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Descarte } from './entities/descarte.entity';
import { CorrigirRecebimentoDto, RecebimentoDto } from './dto/recebimento.dto';

@Injectable()
export class RecebimentosService {
  constructor(private readonly db: DataSource) {}

  async findByProtocol(protocolo: string) {
    return this.db.transaction('REPEATABLE READ', async manager => {
      const pedido = await manager.findOneBy(Descarte, { protocolo: protocolo.trim().toUpperCase() });
      if (!pedido) throw new NotFoundException('Protocolo não encontrado.');
      return this.detail(pedido.id, manager);
    });
  }

  private async detail(id: string, manager: EntityManager) {
    const pedido = await manager.findOne(Descarte, { where: { id }, relations: { ponto_coleta: true } });
    const historico = await manager.query(`
      SELECT h.id, h.versao, h.tipo, h.peso_anterior_kg, h.peso_novo_kg, h.motivo, h.criado_em,
        json_build_object('id', a.id, 'nome', a.nome) AS operador
      FROM recebimento_historico h JOIN admin_sema a ON a.id = h.operador_id
      WHERE h.descarte_id = $1 ORDER BY h.versao
    `, [id]);
    return { ...pedido, historico: historico.map(h => ({
      ...h, peso_anterior_kg: h.peso_anterior_kg == null ? null : Number(h.peso_anterior_kg),
      peso_novo_kg: Number(h.peso_novo_kg),
    })) };
  }

  async receive(id: string, dto: RecebimentoDto, operadorId: string) {
    return this.db.transaction(async manager => {
      const pedido = await manager.findOne(Descarte, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!pedido) throw new NotFoundException('Pedido não encontrado.');
      if (pedido.situacao !== 'PENDENTE') throw new ConflictException('Este pedido não está pendente. Atualize a consulta; nenhum recebimento foi duplicado.');
      if (!pedido.ponto_coleta_id) throw new ConflictException('Pedido antigo sem ponto vinculado. Revise o cadastro antes de receber.');
      await manager.query(`
        UPDATE descarte SET situacao = 'RECEBIDO', peso_recebido_kg = $2, recebido_em = now(),
          recebido_por = $3, recebimento_versao = 1 WHERE id = $1
      `, [id, dto.peso_recebido_kg, operadorId]);
      await manager.query(`
        INSERT INTO recebimento_historico (descarte_id, versao, tipo, peso_novo_kg, operador_id)
        VALUES ($1, 1, 'RECEBIMENTO', $2, $3)
      `, [id, dto.peso_recebido_kg, operadorId]);
      return this.detail(id, manager);
    });
  }

  async correct(id: string, dto: CorrigirRecebimentoDto, operadorId: string) {
    return this.db.transaction(async manager => {
      const pedido = await manager.findOne(Descarte, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!pedido) throw new NotFoundException('Pedido não encontrado.');
      if (pedido.situacao !== 'RECEBIDO') throw new ConflictException('Confirme o recebimento antes de corrigir a pesagem.');
      if (pedido.recebimento_versao !== dto.versao) throw new ConflictException('Outro operador atualizou este pedido. Consulte os valores novamente antes de corrigir.');
      if (pedido.peso_recebido_kg === dto.peso_recebido_kg) throw new ConflictException('O peso informado já é o peso atual.');
      const versao = pedido.recebimento_versao + 1;
      await manager.query('UPDATE descarte SET peso_recebido_kg = $2, recebimento_versao = $3 WHERE id = $1',
        [id, dto.peso_recebido_kg, versao]);
      await manager.query(`
        INSERT INTO recebimento_historico (descarte_id, versao, tipo, peso_anterior_kg, peso_novo_kg, motivo, operador_id)
        VALUES ($1, $2, 'CORRECAO', $3, $4, $5, $6)
      `, [id, versao, pedido.peso_recebido_kg, dto.peso_recebido_kg, dto.motivo, operadorId]);
      return this.detail(id, manager);
    });
  }
}
