CREATE VIEW vw_historico_dispensacao AS
SELECT
    d.id_dispensacao,
    d.id_paciente_externo,
    d.id_receita_externa,
    d.data_dispensacao,
    d.status,
    d.valor_total,
    u.nome AS farmaceutico,
    m.nome_comercial,
    m.principio_ativo,
    i.quantidade,
    i.dosagem,
    i.subtotal
FROM dispensacao d
JOIN usuario u ON u.id_usuario = d.id_usuario
JOIN item_dispensacao i ON i.id_dispensacao = d.id_dispensacao
JOIN medicamento m ON m.id_medicamento = i.id_medicamento;


CREATE OR REPLACE PROCEDURE sp_registrar_dispensacao(
    p_id_receita    INTEGER,
    p_id_paciente   INTEGER,
    p_id_usuario    INTEGER,
    p_id_medicamento INTEGER,
    p_quantidade    INTEGER,
    p_dosagem       VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_dispensacao INTEGER;
    v_preco          NUMERIC(10,2);
    v_subtotal       NUMERIC(10,2);
BEGIN
    SELECT preco_unitario
    INTO v_preco
    FROM medicamento
    WHERE id_medicamento = p_id_medicamento AND ativo = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Medicamento % nao encontrado ou inativo', p_id_medicamento;
    END IF;

    v_subtotal := v_preco * p_quantidade;

    INSERT INTO dispensacao (id_receita_externa, id_paciente_externo, id_usuario, valor_total)
    VALUES (p_id_receita, p_id_paciente, p_id_usuario, v_subtotal)
    RETURNING id_dispensacao INTO v_id_dispensacao;

    INSERT INTO item_dispensacao (id_dispensacao, id_medicamento, quantidade, dosagem, preco_unitario, subtotal)
    VALUES (v_id_dispensacao, p_id_medicamento, p_quantidade, p_dosagem, v_preco, v_subtotal);

    INSERT INTO log_auditoria (id_dispensacao, id_usuario, operacao, resultado, detalhe)
    VALUES (v_id_dispensacao, p_id_usuario, 'DISPENSACAO', 'SUCESSO',
            'Receita ' || p_id_receita || ' dispensada');
END;
$$;


CREATE OR REPLACE FUNCTION fn_baixa_estoque()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_estoque INTEGER;
BEGIN
    SELECT estoque_atual INTO v_estoque
    FROM medicamento
    WHERE id_medicamento = NEW.id_medicamento;

    IF v_estoque < NEW.quantidade THEN
        RAISE EXCEPTION 'Estoque insuficiente para o medicamento %', NEW.id_medicamento;
    END IF;

    UPDATE medicamento
    SET estoque_atual = estoque_atual - NEW.quantidade
    WHERE id_medicamento = NEW.id_medicamento;

    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_baixa_estoque
AFTER INSERT ON item_dispensacao
FOR EACH ROW
EXECUTE FUNCTION fn_baixa_estoque();
