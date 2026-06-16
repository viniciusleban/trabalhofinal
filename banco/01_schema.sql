CREATE TABLE medicamento (
    id_medicamento   SERIAL PRIMARY KEY,
    nome_comercial   VARCHAR(120) NOT NULL,
    principio_ativo  VARCHAR(120) NOT NULL,
    forma_farmaceutica VARCHAR(60) NOT NULL,
    concentracao     VARCHAR(40)  NOT NULL,
    unidade_medida   VARCHAR(20)  NOT NULL,
    preco_unitario   NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    estoque_atual    INTEGER NOT NULL DEFAULT 0,
    ativo            BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_medicamento_nome UNIQUE (nome_comercial, concentracao),
    CONSTRAINT ck_medicamento_estoque CHECK (estoque_atual >= 0),
    CONSTRAINT ck_medicamento_preco CHECK (preco_unitario >= 0)
);

CREATE TABLE usuario (
    id_usuario   SERIAL PRIMARY KEY,
    nome         VARCHAR(120) NOT NULL,
    email        VARCHAR(160) NOT NULL,
    senha_hash   VARCHAR(255) NOT NULL,
    papel        VARCHAR(20)  NOT NULL DEFAULT 'farmaceutico',
    ativo        BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuario_email UNIQUE (email),
    CONSTRAINT ck_usuario_papel CHECK (papel IN ('farmaceutico', 'auditor', 'admin'))
);

CREATE TABLE dispensacao (
    id_dispensacao    SERIAL PRIMARY KEY,
    id_receita_externa VARCHAR(50) NOT NULL,
    id_paciente_externo INTEGER NOT NULL,
    id_usuario        INTEGER NOT NULL,
    data_dispensacao  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status            VARCHAR(25) NOT NULL DEFAULT 'pendente_faturamento',
    valor_total       NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    observacao        VARCHAR(255),
    CONSTRAINT fk_dispensacao_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
    CONSTRAINT ck_dispensacao_status
        CHECK (status IN ('pendente_faturamento', 'faturado', 'cancelado')),
    CONSTRAINT ck_dispensacao_valor CHECK (valor_total >= 0)
);

CREATE TABLE item_dispensacao (
    id_item          SERIAL PRIMARY KEY,
    id_dispensacao   INTEGER NOT NULL,
    id_medicamento   INTEGER NOT NULL,
    quantidade       INTEGER NOT NULL,
    dosagem          VARCHAR(60) NOT NULL,
    preco_unitario   NUMERIC(10,2) NOT NULL,
    subtotal         NUMERIC(10,2) NOT NULL,
    CONSTRAINT fk_item_dispensacao
        FOREIGN KEY (id_dispensacao) REFERENCES dispensacao (id_dispensacao) ON DELETE CASCADE,
    CONSTRAINT fk_item_medicamento
        FOREIGN KEY (id_medicamento) REFERENCES medicamento (id_medicamento),
    CONSTRAINT ck_item_quantidade CHECK (quantidade > 0),
    CONSTRAINT ck_item_subtotal CHECK (subtotal >= 0)
);

CREATE TABLE log_auditoria (
    id_log         SERIAL PRIMARY KEY,
    id_dispensacao INTEGER,
    id_usuario     INTEGER NOT NULL,
    operacao       VARCHAR(40) NOT NULL,
    resultado      VARCHAR(40) NOT NULL,
    data_evento    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    detalhe        VARCHAR(255),
    CONSTRAINT fk_log_dispensacao
        FOREIGN KEY (id_dispensacao) REFERENCES dispensacao (id_dispensacao) ON DELETE SET NULL,
    CONSTRAINT fk_log_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
);

CREATE INDEX idx_dispensacao_paciente ON dispensacao (id_paciente_externo);
CREATE INDEX idx_dispensacao_status ON dispensacao (status);
CREATE INDEX idx_dispensacao_data ON dispensacao (data_dispensacao);
CREATE INDEX idx_item_dispensacao ON item_dispensacao (id_dispensacao);
CREATE INDEX idx_item_medicamento ON item_dispensacao (id_medicamento);
CREATE INDEX idx_log_dispensacao ON log_auditoria (id_dispensacao);
