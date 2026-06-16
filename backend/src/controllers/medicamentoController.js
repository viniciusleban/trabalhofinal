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

export async function atualizar(req, res) {
  const { id } = req.params;
  const { nomeComercial, principioAtivo, formaFarmaceutica, concentracao, unidadeMedida, precoUnitario, estoqueAtual } = req.body;
  try {
    const result = await query(
      `UPDATE medicamento SET nome_comercial=$1, principio_ativo=$2, forma_farmaceutica=$3,
       concentracao=$4, unidade_medida=$5, preco_unitario=$6, estoque_atual=$7
       WHERE id_medicamento=$8 RETURNING *`,
      [nomeComercial, principioAtivo, formaFarmaceutica, concentracao, unidadeMedida, precoUnitario, estoqueAtual, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Medicamento não encontrado' });
    return res.json(result.rows[0]);
  } catch (e) {
    return res.status(500).json({ erro: 'Erro ao atualizar medicamento' });
  }
}

export async function excluir(req, res) {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM medicamento WHERE id_medicamento=$1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Medicamento não encontrado' });
    return res.json({ mensagem: 'Medicamento excluído com sucesso' });
  } catch (e) {
    return res.status(500).json({ erro: 'Erro ao excluir medicamento' });
  }
}