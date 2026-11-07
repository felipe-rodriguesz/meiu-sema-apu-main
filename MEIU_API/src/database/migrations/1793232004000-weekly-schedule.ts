import { MigrationInterface, QueryRunner } from 'typeorm';

export class WeeklySchedule1793232004000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE ponto_coleta
      ADD COLUMN horarios_semana jsonb NOT NULL DEFAULT '[]',
      ADD COLUMN materiais_lista text[] NOT NULL DEFAULT '{}',
      ADD CONSTRAINT ponto_horarios_array CHECK (jsonb_typeof(horarios_semana) = 'array' AND jsonb_array_length(horarios_semana) <= 7)`);
    await q.query(`UPDATE ponto_coleta p SET horarios_semana = COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('dia', dia, 'inicio', p.horario_inicio, 'fim', p.horario_fim) ORDER BY dia)
        FROM unnest(p.dias_semana) dia), '[]'::jsonb),
      materiais_lista = CASE WHEN nullif(trim(materiais_aceitos), '') IS NULL THEN '{}'::text[] ELSE ARRAY[materiais_aceitos] END`);
  }
  async down(q: QueryRunner): Promise<void> {
    const [r] = await q.query(`SELECT EXISTS(SELECT 1 FROM ponto_coleta
      WHERE jsonb_array_length(horarios_semana) > 0 OR cardinality(materiais_lista) > 0) AS populated`);
    if (r.populated) throw new Error('Existem horários por dia ou materiais cadastrados. Restaure um backup para reverter.');
    await q.query('ALTER TABLE ponto_coleta DROP COLUMN horarios_semana, DROP COLUMN materiais_lista');
  }
}
