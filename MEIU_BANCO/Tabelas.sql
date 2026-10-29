-- REFERÊNCIA PARA BANCO VAZIO. Atualizações devem usar npm run migration:run.
-- O migrador instala esta estrutura e mantém o histórico em meiu_migrations.
BEGIN;
-- =============================================================
-- Banco: produção_neondb (Neon)
-- =============================================================

-- Extensão para suporte a UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------
-- Tabela: admin_sema
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_sema (
    id          UUID                     NOT NULL DEFAULT gen_random_uuid(),
    nome        CHARACTER VARYING        NOT NULL,
    email       CHARACTER VARYING        NOT NULL,
    senha_hash  CHARACTER VARYING        NOT NULL,
    criado_em   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT pk_admin_sema PRIMARY KEY (id),
    CONSTRAINT uq_admin_sema_email UNIQUE (email)
);

-- -------------------------------------------------------------
-- Tabela: ponto_coleta
-- Precisa vir antes de descarte por causa da FK
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ponto_coleta (
    id          UUID                     NOT NULL DEFAULT gen_random_uuid(),
    nome        CHARACTER VARYING        NOT NULL,
    tipo        CHARACTER VARYING        NOT NULL,
    bairro      CHARACTER VARYING,
    endereco    CHARACTER VARYING,
    lat         NUMERIC,
    lon         NUMERIC,
    status      CHARACTER VARYING        DEFAULT 'ATIVO',
    criado_em   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT pk_ponto_coleta PRIMARY KEY (id)
);

-- -------------------------------------------------------------
-- Tabela: descarte
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS descarte (
    id                UUID                        NOT NULL DEFAULT gen_random_uuid(),
    protocolo         CHARACTER VARYING           NOT NULL,
    criado_em         TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    situacao          CHARACTER VARYING           DEFAULT 'PENDENTE',
    eh_mistura        BOOLEAN,
    residuo_principal CHARACTER VARYING,
    quantidade_kg     NUMERIC(12,3) CHECK (quantidade_kg > 0),
    frequencia_dias   INTEGER CHECK (frequencia_dias > 0),
    material          CHARACTER VARYING,
    estado_material   CHARACTER VARYING,
    tipo_tecido       CHARACTER VARYING,
    lat               NUMERIC,
    lon               NUMERIC,
    ponto_coleta_id   UUID,

    CONSTRAINT pk_descarte PRIMARY KEY (id),
    CONSTRAINT uq_descarte_protocolo UNIQUE (protocolo),
    CONSTRAINT fk_descarte_ponto_coleta
      FOREIGN KEY (ponto_coleta_id)
      REFERENCES ponto_coleta(id)
);

-- -------------------------------------------------------------
-- Tabela: noticias
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS noticias (
    id               UUID                     NOT NULL DEFAULT gen_random_uuid(),
    titulo           CHARACTER VARYING        NOT NULL,
    resumo           CHARACTER VARYING,
    categoria        CHARACTER VARYING,
    data_publicacao  DATE,
    criado_em        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT pk_noticias PRIMARY KEY (id)
);

-- -------------------------------------------------------------
-- View: estatisticas_descarte
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW estatisticas_descarte AS
SELECT
    (SELECT COUNT(*) FROM descarte) AS total_registros,
    (SELECT COALESCE(SUM(quantidade_kg), 0) FROM descarte) AS total_kg,
    (SELECT residuo_principal FROM descarte GROUP BY residuo_principal ORDER BY COUNT(*) DESC LIMIT 1) AS residuo_mais_comum,
    CURRENT_DATE AS data_atualizacao;
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
    
COMMIT;
