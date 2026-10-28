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
    quantidade_kg     INTEGER,
    frequencia_dias   INTEGER,
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