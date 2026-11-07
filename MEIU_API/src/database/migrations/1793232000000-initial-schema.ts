import { MigrationInterface, QueryRunner } from 'typeorm';

// Reconhece a estrutura original sem remover registros; também instala um banco vazio.
export class InitialSchema1793232000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE TABLE IF NOT EXISTS admin_sema (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome varchar NOT NULL,
        email varchar NOT NULL UNIQUE, senha_hash varchar NOT NULL,
        criado_em timestamptz DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS ponto_coleta (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome varchar NOT NULL, tipo varchar NOT NULL,
        bairro varchar, endereco varchar, lat numeric, lon numeric,
        status varchar DEFAULT 'ATIVO', criado_em timestamp DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS descarte (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), protocolo varchar NOT NULL UNIQUE,
        criado_em timestamp NOT NULL DEFAULT now(), situacao varchar DEFAULT 'PENDENTE',
        eh_mistura boolean, residuo_principal varchar, quantidade_kg integer, frequencia_dias integer,
        material varchar, estado_material varchar, tipo_tecido varchar, lat numeric, lon numeric,
        ponto_coleta_id uuid REFERENCES ponto_coleta(id)
      );
      CREATE TABLE IF NOT EXISTS noticias (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), titulo varchar NOT NULL, resumo varchar,
        categoria varchar, data_publicacao date, criado_em timestamptz DEFAULT now()
      );
      CREATE OR REPLACE VIEW estatisticas_descarte AS SELECT
        (SELECT COUNT(*) FROM descarte) AS total_registros,
        (SELECT COALESCE(SUM(quantidade_kg), 0) FROM descarte) AS total_kg,
        (SELECT residuo_principal FROM descarte GROUP BY residuo_principal ORDER BY COUNT(*) DESC LIMIT 1) AS residuo_mais_comum,
        CURRENT_DATE AS data_atualizacao;
    `);
  }
  async down(): Promise<void> {
    throw new Error('A estrutura inicial pode conter dados anteriores. Restaure um backup para reverter.');
  }
}
