import { query } from '../db.js';

export async function listar(req, res) {
  const resultado = await query(
    'SELECT id_medicamento, nome_comercial, principio_ativo, forma_farmaceutica, concentracao, unidade_medida, preco_unitario, estoque_atual, ativo FROM medicamento ORDER BY nome_comercial'
  );
  return res.json(resultado.rows);
}

export async function buscarPorId(req, res) {
  const { id } = req.params;
  const resultado = await query('SELECT * FROM medicamento WHERE id_medicamento = $1', [id]);

  if (resultado.rowCount === 0) {
    return res.status(404).json({ erro: 'Medicamento nao encontrado' });
  }

  return res.json(resultado.rows[0]);
}

export async function criar(req, res) {
  const {
    nomeComercial, principioAtivo, formaFarmaceutica,
    concentracao, unidadeMedida, precoUnitario, estoqueAtual
  } = req.body;

  if (!nomeComercial || !principioAtivo || !formaFarmaceutica || !concentracao || !unidadeMedida) {
    return res.status(400).json({ erro: 'Campos obrigatorios ausentes' });
  }

  const duplicado = await query(
    'SELECT id_medicamento FROM medicamento WHERE nome_comercial = $1 AND concentracao = $2',
    [nomeComercial, concentracao]
  );

  if (duplicado.rowCount > 0) {
    return res.status(409).json({ erro: 'Medicamento ja cadastrado com essa concentracao' });
  }

  const resultado = await query(
    `INSERT INTO medicamento
      (nome_comercial, principio_ativo, forma_farmaceutica, concentracao, unidade_medida, preco_unitario, estoque_atual)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [nomeComercial, principioAtivo, formaFarmaceutica, concentracao, unidadeMedida, precoUnitario || 0, estoqueAtual || 0]
  );

  return res.status(201).json(resultado.rows[0]);
}

export async function atualizarEstoque(req, res) {
  const { id } = req.params;
  const { estoqueAtual } = req.body;

  if (estoqueAtual === undefined || estoqueAtual < 0) {
    return res.status(400).json({ erro: 'Estoque invalido' });
  }

  const resultado = await query(
    'UPDATE medicamento SET estoque_atual = $1 WHERE id_medicamento = $2 RETURNING *',
    [estoqueAtual, id]
  );

  if (resultado.rowCount === 0) {
    return res.status(404).json({ erro: 'Medicamento nao encontrado' });
  }

  return res.json(resultado.rows[0]);
}
