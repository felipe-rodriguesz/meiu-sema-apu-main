import { MigrationInterface, QueryRunner } from 'typeorm';

export class Weights1793232001000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    const [invalid] = await q.query(`SELECT count(*)::int AS total FROM descarte
      WHERE quantidade_kg <= 0 OR quantidade_kg > 999999999.999 OR frequencia_dias <= 0`);
    if (invalid.total) throw new Error('Existem pesos/frequências inválidos no banco. Corrija-os antes de migrar; nenhum registro foi removido.');
    // A view depende do tipo de quantidade_kg; recriá-la na mesma transação é necessário.
    await q.query(`
      DROP VIEW estatisticas_descarte;
      ALTER TABLE descarte ALTER COLUMN quantidade_kg TYPE numeric(12,3);
      ALTER TABLE descarte ADD CONSTRAINT ck_descarte_peso CHECK (quantidade_kg > 0);
      ALTER TABLE descarte ADD CONSTRAINT ck_descarte_frequencia CHECK (frequencia_dias > 0);
      CREATE VIEW estatisticas_descarte AS SELECT
        (SELECT COUNT(*) FROM descarte) AS total_registros,
        (SELECT COALESCE(SUM(quantidade_kg), 0) FROM descarte) AS total_kg,
        (SELECT residuo_principal FROM descarte GROUP BY residuo_principal ORDER BY COUNT(*) DESC LIMIT 1) AS residuo_mais_comum,
        CURRENT_DATE AS data_atualizacao;
    `);
  }
  async down(q: QueryRunner): Promise<void> {
    const [fractional] = await q.query('SELECT count(*)::int AS total FROM descarte WHERE quantidade_kg <> trunc(quantidade_kg)');
    if (fractional.total) throw new Error('Reversão recusada: perderia pesos fracionados. Use um backup.');
    await q.query(`
      DROP VIEW estatisticas_descarte;
      ALTER TABLE descarte DROP CONSTRAINT ck_descarte_peso, DROP CONSTRAINT ck_descarte_frequencia;
      ALTER TABLE descarte ALTER COLUMN quantidade_kg TYPE integer;
      CREATE VIEW estatisticas_descarte AS SELECT
        (SELECT COUNT(*) FROM descarte) AS total_registros,
        (SELECT COALESCE(SUM(quantidade_kg), 0) FROM descarte) AS total_kg,
        (SELECT residuo_principal FROM descarte GROUP BY residuo_principal ORDER BY COUNT(*) DESC LIMIT 1) AS residuo_mais_comum,
        CURRENT_DATE AS data_atualizacao;
    `);
  }
}
