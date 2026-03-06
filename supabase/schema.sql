-- ============================================================
-- GUINCHO NA HORA CRM — Schema PostgreSQL + Seeds
-- Execute este arquivo no Supabase SQL Editor
-- ============================================================

-- ============================================================
-- ENUMs
-- ============================================================

CREATE TYPE status_pagamento AS ENUM ('pendente', 'pago', 'vencido', 'cancelado');
CREATE TYPE status_geral AS ENUM ('ativo', 'inativo');
CREATE TYPE status_recurso AS ENUM ('disponivel', 'em_uso', 'manutencao');

-- ============================================================
-- FUNÇÃO: updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABELA: clientes
-- ============================================================

CREATE TABLE clientes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        VARCHAR(255) NOT NULL UNIQUE,
  email       VARCHAR(255),
  telefone    VARCHAR(20),
  cidade      VARCHAR(100),
  observacoes TEXT,
  status      status_geral NOT NULL DEFAULT 'ativo',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: equipamentos
-- ============================================================

CREATE TABLE equipamentos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo       VARCHAR(100) NOT NULL UNIQUE,
  descricao  TEXT,
  status     status_recurso NOT NULL DEFAULT 'disponivel',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_equipamentos_updated_at
  BEFORE UPDATE ON equipamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: veiculos
-- ============================================================

CREATE TABLE veiculos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo        VARCHAR(100) NOT NULL,
  placa         VARCHAR(20) UNIQUE,
  ano           INTEGER,
  capacidade_kg INTEGER,
  status        status_recurso NOT NULL DEFAULT 'disponivel',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_veiculos_updated_at
  BEFORE UPDATE ON veiculos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: motoristas
-- ============================================================

CREATE TABLE motoristas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       VARCHAR(255) NOT NULL UNIQUE,
  telefone   VARCHAR(20),
  cnh        VARCHAR(20),
  veiculo_id UUID REFERENCES veiculos(id),
  status     status_geral NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_motoristas_updated_at
  BEFORE UPDATE ON motoristas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: atendimentos (CORE)
-- ============================================================

CREATE TABLE atendimentos (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_atendimento VARCHAR(50) NOT NULL UNIQUE,
  data               DATE NOT NULL,
  cliente_id         UUID NOT NULL REFERENCES clientes(id),
  valor              DECIMAL(10,2) NOT NULL CHECK (valor > 0),
  local_retirada     VARCHAR(255) NOT NULL,
  local_entrega      VARCHAR(255) NOT NULL,
  equipamento_id     UUID NOT NULL REFERENCES equipamentos(id),
  motorista_id       UUID NOT NULL REFERENCES motoristas(id),
  veiculo_id         UUID NOT NULL REFERENCES veiculos(id),
  numero_pedido      VARCHAR(50),
  nota_fiscal        VARCHAR(50),
  data_vencimento    DATE,
  status_pagamento   status_pagamento NOT NULL DEFAULT 'pendente',
  data_pagamento     DATE,
  metodo_pagamento   VARCHAR(50),
  observacoes        TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  created_by         UUID REFERENCES auth.users(id),
  updated_by         UUID REFERENCES auth.users(id)
);

CREATE TRIGGER update_atendimentos_updated_at
  BEFORE UPDATE ON atendimentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX idx_atendimentos_data            ON atendimentos(data DESC);
CREATE INDEX idx_atendimentos_cliente         ON atendimentos(cliente_id);
CREATE INDEX idx_atendimentos_motorista       ON atendimentos(motorista_id);
CREATE INDEX idx_atendimentos_status_pgto     ON atendimentos(status_pagamento);
CREATE INDEX idx_atendimentos_data_vencimento ON atendimentos(data_vencimento);
CREATE INDEX idx_atendimentos_numero          ON atendimentos(numero_atendimento);

-- ============================================================
-- TABELA: auditoria
-- ============================================================

CREATE TABLE auditoria (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela      VARCHAR(100) NOT NULL,
  registro_id UUID NOT NULL,
  acao        VARCHAR(20) NOT NULL CHECK (acao IN ('CREATE','UPDATE','DELETE')),
  dados_antes JSONB,
  dados_novos JSONB,
  usuario_id  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auditoria_registro ON auditoria(registro_id);
CREATE INDEX idx_auditoria_tabela   ON auditoria(tabela);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE clientes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipamentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoristas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria     ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários autenticados podem fazer tudo
CREATE POLICY "Autenticado pode ler clientes"
  ON clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticado pode inserir clientes"
  ON clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticado pode atualizar clientes"
  ON clientes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Autenticado pode ler equipamentos"
  ON equipamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticado pode inserir equipamentos"
  ON equipamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticado pode atualizar equipamentos"
  ON equipamentos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Autenticado pode ler veiculos"
  ON veiculos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticado pode inserir veiculos"
  ON veiculos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticado pode atualizar veiculos"
  ON veiculos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Autenticado pode ler motoristas"
  ON motoristas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticado pode inserir motoristas"
  ON motoristas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticado pode atualizar motoristas"
  ON motoristas FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Autenticado pode ler atendimentos"
  ON atendimentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticado pode inserir atendimentos"
  ON atendimentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticado pode atualizar atendimentos"
  ON atendimentos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Autenticado pode ler auditoria"
  ON auditoria FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticado pode inserir auditoria"
  ON auditoria FOR INSERT TO authenticated WITH CHECK (true);

-- Service role bypasses RLS (para webhook n8n)
CREATE POLICY "Service pode gerenciar clientes"
  ON clientes FOR ALL TO service_role USING (true);
CREATE POLICY "Service pode gerenciar equipamentos"
  ON equipamentos FOR ALL TO service_role USING (true);
CREATE POLICY "Service pode gerenciar veiculos"
  ON veiculos FOR ALL TO service_role USING (true);
CREATE POLICY "Service pode gerenciar motoristas"
  ON motoristas FOR ALL TO service_role USING (true);
CREATE POLICY "Service pode gerenciar atendimentos"
  ON atendimentos FOR ALL TO service_role USING (true);
CREATE POLICY "Service pode gerenciar auditoria"
  ON auditoria FOR ALL TO service_role USING (true);

-- ============================================================
-- SEEDS — Clientes
-- ============================================================

INSERT INTO clientes (nome, status) VALUES
  ('Irmen Sany', 'ativo'),
  ('CAE', 'ativo'),
  ('Pompeu Perfurações', 'ativo'),
  ('Fort Máquinas', 'ativo'),
  ('Uzimaza', 'ativo'),
  ('Ruston', 'ativo'),
  ('Garagem', 'ativo'),
  ('Autoneum', 'ativo'),
  ('BASF Jacareí', 'ativo'),
  ('Fic Cimentos', 'ativo'),
  ('Simoldes', 'ativo'),
  ('Houston', 'ativo');

-- ============================================================
-- SEEDS — Equipamentos
-- ============================================================

INSERT INTO equipamentos (tipo, status) VALUES
  ('Escavadeira', 'disponivel'),
  ('Escavadeira Sany', 'disponivel'),
  ('Escavadeira Sany 1.5t', 'disponivel'),
  ('Bobcat', 'disponivel'),
  ('Bobcat e Escavadeira 16', 'disponivel'),
  ('Trator', 'disponivel'),
  ('Empilhadeira', 'disponivel'),
  ('Paleteira', 'disponivel'),
  ('Pá Carregadeira', 'disponivel'),
  ('Plataforma Tesourinha', 'disponivel'),
  ('Carro', 'disponivel'),
  ('Peça', 'disponivel'),
  ('Retroescavadeira', 'disponivel'),
  ('Transpaleteira', 'disponivel');

-- ============================================================
-- SEEDS — Veículos
-- ============================================================

INSERT INTO veiculos (modelo, placa, status) VALUES
  ('VW Constellation', NULL, 'disponivel'),
  ('Ford Cargo 1119', NULL, 'disponivel');

-- ============================================================
-- SEEDS — Motoristas (após inserir veículos)
-- ============================================================

WITH v1 AS (SELECT id FROM veiculos WHERE modelo = 'VW Constellation' LIMIT 1),
     v2 AS (SELECT id FROM veiculos WHERE modelo = 'Ford Cargo 1119' LIMIT 1)
INSERT INTO motoristas (nome, veiculo_id, status)
VALUES
  ('Jean',     (SELECT id FROM v1), 'ativo'),
  ('Jefferson',(SELECT id FROM v2), 'ativo');
