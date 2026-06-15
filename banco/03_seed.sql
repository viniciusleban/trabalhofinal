INSERT INTO usuario (nome, email, senha_hash, papel) VALUES
('Vinicius Leban', 'vinicius@g8.com', '$2a$10$vwhHU/8rV15jvHsWWgCpOOzxeb81pr23CBt0IBaUpfGiMCRwFFhSG', 'farmaceutico'),
('Pedro Tormem', 'pedro@g8.com', '$2a$10$vwhHU/8rV15jvHsWWgCpOOzxeb81pr23CBt0IBaUpfGiMCRwFFhSG', 'farmaceutico'),
('Gabriel Sartori', 'gabriel@g8.com', '$2a$10$vwhHU/8rV15jvHsWWgCpOOzxeb81pr23CBt0IBaUpfGiMCRwFFhSG', 'auditor');

-- senhas 'senha123' geradas pelo gerar-hash.js
-- cd backend
-- node .\gerar-hash.js

INSERT INTO medicamento (nome_comercial, principio_ativo, forma_farmaceutica, concentracao, unidade_medida, preco_unitario, estoque_atual) VALUES
('Dipirona Sodica', 'Dipirona', 'Comprimido', '500mg', 'comprimido', 0.45, 500),
('Amoxicilina', 'Amoxicilina', 'Capsula', '500mg', 'capsula', 1.20, 300),
('Losartana Potassica', 'Losartana', 'Comprimido', '50mg', 'comprimido', 0.30, 800),
('Omeprazol', 'Omeprazol', 'Capsula', '20mg', 'capsula', 0.55, 400),
('Paracetamol', 'Paracetamol', 'Comprimido', '750mg', 'comprimido', 0.35, 600);

CALL sp_registrar_dispensacao(101, 5001, 1, 1, 20, '1 comprimido a cada 8h');
CALL sp_registrar_dispensacao(102, 5002, 1, 2, 21, '1 capsula a cada 12h');

SELECT * FROM vw_historico_dispensacao;
