import { MigrationInterface, QueryRunner } from 'typeorm';

export class PointOperation1793232003000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE ponto_coleta
      ADD COLUMN dias_semana integer[] NOT NULL DEFAULT '{}',
      ADD COLUMN data_inicio date,
      ADD COLUMN data_fim date,
      ADD COLUMN horario_inicio varchar(5),
      ADD COLUMN horario_fim varchar(5),
      ADD COLUMN materiais_aceitos text,
      ADD COLUMN limite_kg_por_pedido numeric(12,3),
      ADD COLUMN orientacoes text,
      ADD CONSTRAINT ponto_limite_positivo CHECK (limite_kg_por_pedido > 0),
      ADD CONSTRAINT ponto_datas_validas CHECK (data_inicio IS NULL OR data_fim IS NULL OR data_inicio <= data_fim)`);
  }
  async down(q: QueryRunner): Promise<void> {
    const [result] = await q.query(`SELECT EXISTS(SELECT 1 FROM ponto_coleta
      WHERE cardinality(dias_semana) > 0 OR data_inicio IS NOT NULL OR data_fim IS NOT NULL
      OR horario_inicio IS NOT NULL OR horario_fim IS NOT NULL OR materiais_aceitos IS NOT NULL
      OR limite_kg_por_pedido IS NOT NULL OR orientacoes IS NOT NULL) AS populated`);
    if (result.populated) throw new Error('Existem condições de atendimento cadastradas. Restaure um backup para reverter sem perder dados.');
    await q.query(`ALTER TABLE ponto_coleta
      DROP COLUMN orientacoes, DROP COLUMN limite_kg_por_pedido,
      DROP COLUMN materiais_aceitos, DROP COLUMN horario_fim,
      DROP COLUMN horario_inicio, DROP COLUMN data_fim,
      DROP COLUMN data_inicio, DROP COLUMN dias_semana`);
  }
}
