import { MigrationInterface, QueryRunner } from 'typeorm';

export class Receipts1793232002000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    const [legacy] = await q.query("SELECT count(*)::int AS total FROM descarte WHERE situacao = 'RECEBIDO'");
    if (legacy.total) throw new Error('Existem registros RECEBIDO sem pesagem auditada. Revise esses registros antes da migração.');
    await q.query(`
      ALTER TABLE descarte
        ADD COLUMN peso_recebido_kg numeric(12,3),
        ADD COLUMN recebido_em timestamptz,
        ADD COLUMN recebido_por uuid REFERENCES admin_sema(id),
        ADD COLUMN recebimento_versao integer NOT NULL DEFAULT 0,
        ADD CONSTRAINT ck_recebimento_completo CHECK (
          (situacao = 'RECEBIDO' AND peso_recebido_kg IS NOT NULL AND peso_recebido_kg > 0
            AND recebido_em IS NOT NULL AND recebido_por IS NOT NULL AND recebimento_versao >= 1)
          OR (situacao IS DISTINCT FROM 'RECEBIDO' AND peso_recebido_kg IS NULL
            AND recebido_em IS NULL AND recebido_por IS NULL AND recebimento_versao = 0)
        );
      CREATE TABLE recebimento_historico (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        descarte_id uuid NOT NULL REFERENCES descarte(id),
        versao integer NOT NULL CHECK (versao >= 1),
        tipo varchar NOT NULL CHECK (tipo IN ('RECEBIMENTO', 'CORRECAO')),
        peso_anterior_kg numeric(12,3),
        peso_novo_kg numeric(12,3) NOT NULL CHECK (peso_novo_kg > 0),
        motivo varchar(500),
        operador_id uuid NOT NULL REFERENCES admin_sema(id),
        criado_em timestamptz NOT NULL DEFAULT now(),
        UNIQUE (descarte_id, versao),
        CHECK ((tipo = 'RECEBIMENTO' AND peso_anterior_kg IS NULL AND versao = 1)
          OR (tipo = 'CORRECAO' AND peso_anterior_kg IS NOT NULL AND peso_anterior_kg > 0
            AND motivo IS NOT NULL AND length(trim(motivo)) >= 5 AND versao > 1))
      );
      CREATE INDEX idx_descarte_recebido_em ON descarte(recebido_em) WHERE situacao = 'RECEBIDO';
      CREATE INDEX idx_descarte_ponto ON descarte(ponto_coleta_id);
    `);
  }
  async down(q: QueryRunner): Promise<void> {
    const [data] = await q.query('SELECT count(*)::int AS total FROM recebimento_historico');
    if (data.total) throw new Error('Reversão recusada: existem recebimentos e histórico. Restaure um backup.');
    await q.query(`
      DROP TABLE recebimento_historico;
      DROP INDEX idx_descarte_recebido_em;
      DROP INDEX idx_descarte_ponto;
      ALTER TABLE descarte DROP CONSTRAINT ck_recebimento_completo,
        DROP COLUMN peso_recebido_kg, DROP COLUMN recebido_em, DROP COLUMN recebido_por,
        DROP COLUMN recebimento_versao;
    `);
  }
}
