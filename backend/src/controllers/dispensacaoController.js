import { query, getClient } from '../db.js';
import { buscarReceita, receitaEhValida, marcarReceitaDispensada } from '../services/g6Service.js';

export async function validarReceita(req, res) {
  try {
    const { idReceita } = req.params;

    // A chamada perigosa agora está presa no try/catch
    const receita = await buscarReceita(idReceita);
    const validacao = receitaEhValida(receita);

    if (!validacao.valida) {
      const codigo = validacao.motivo === 'Receita não encontrada' ? 404 : 422;
      return res.status(codigo).json({ valida: false, motivo: validacao.motivo });
    }

    return res.json({ valida: true, receita });

  } catch (erro) {
    console.error("Erro ao validar receita com o módulo de receitas:", erro.message);
    return res.status(500).json({ 
      valida: false, 
      motivo: 'Falha de comunicação com o sistema de receitas (G6).' 
    });
  }
}

export async function registrarDispensacao(req, res) {
  try {
    const { idReceita, itens } = req.body;
    const idUsuario = req.usuario.id;

    if (!idReceita || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ erro: 'Receita e itens são obrigatórios' });
    }

    const receita = await buscarReceita(idReceita);
    const validacao = receitaEhValida(receita);

    if (!validacao.valida) {
      const codigo = validacao.motivo === 'Receita não encontrada' ? 404 : 422;
      await query(
        'INSERT INTO log_auditoria (id_usuario, operacao, resultado, detalhe) VALUES ($1, $2, $3, $4)',
        [idUsuario, 'DISPENSACAO', 'REJEITADA', validacao.motivo]
      );
      return res.status(codigo).json({ erro: validacao.motivo });
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      let valorTotal = 0;
      const itensCalculados = [];

      for (const item of itens) {
        const med = await client.query(
          'SELECT preco_unitario, estoque_atual, ativo FROM medicamento WHERE id_medicamento = $1',
          [item.idMedicamento]
        );

        if (med.rowCount === 0 || !med.rows[0].ativo) {
          await client.query('ROLLBACK');
          return res.status(422).json({ erro: `Medicamento ${item.idMedicamento} indisponivel` });
        }

        if (med.rows[0].estoque_atual < item.quantidade) {
          await client.query('ROLLBACK');
          return res.status(422).json({ erro: `Estoque insuficiente para o medicamento ${item.idMedicamento}` });
        }

        const preco = Number(med.rows[0].preco_unitario);
        const subtotal = preco * item.quantidade;
        valorTotal += subtotal;
        itensCalculados.push({ ...item, preco, subtotal });
      }

      const dispensacao = await client.query(
        `INSERT INTO dispensacao (id_receita_externa, id_paciente_externo, id_usuario, valor_total)
         VALUES ($1, $2, $3, $4) RETURNING id_dispensacao`,
        [idReceita, receita.pacienteId, idUsuario, valorTotal]
      );

      const idDispensacao = dispensacao.rows[0].id_dispensacao;

      for (const item of itensCalculados) {
        await client.query(
          `INSERT INTO item_dispensacao
            (id_dispensacao, id_medicamento, quantidade, dosagem, preco_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [idDispensacao, item.idMedicamento, item.quantidade, item.dosagem || '', item.preco, item.subtotal]
        );
      }

      await client.query(
        'INSERT INTO log_auditoria (id_dispensacao, id_usuario, operacao, resultado, detalhe) VALUES ($1, $2, $3, $4, $5)',
        [idDispensacao, idUsuario, 'DISPENSACAO', 'SUCESSO', `Receita ${idReceita} dispensada`]
      );

      await client.query('COMMIT');

      await marcarReceitaDispensada(idReceita);

      return res.status(201).json({ idDispensacao, valorTotal, status: 'pendente_faturamento' });
    } catch (erro) {
      await client.query('ROLLBACK');
      console.error("Erro no banco de dados:", erro.message);
      return res.status(500).json({ erro: 'Falha ao registrar dispensação' });
    } finally {
      client.release();
    }

  } catch (erro) {
    console.error("Erro na integração com o G6 durante a dispensação:", erro.message);
    return res.status(500).json({ erro: 'Falha de comunicação com o sistema de receitas (G6).' });
  }
}

export async function listarDispensacoes(req, res) {
  const { pacienteId, dataInicio, dataFim, status } = req.query;
  const pagina = Math.max(1, Number(req.query.pagina) || 1);
  const limite = 50;
  const offset = (pagina - 1) * limite;

  const filtros = [];
  const valores = [];
  let i = 1;

  if (pacienteId) { filtros.push(`id_paciente_externo = $${i++}`); valores.push(pacienteId); }
  if (status) { filtros.push(`status = $${i++}`); valores.push(status); }
  if (dataInicio) { filtros.push(`data_dispensacao >= $${i++}`); valores.push(dataInicio); }
  if (dataFim) { filtros.push(`data_dispensacao <= $${i++}`); valores.push(dataFim); }

  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

  const total = await query(`SELECT COUNT(*) FROM dispensacao ${where}`, valores);
  const totalRegistros = Number(total.rows[0].count);

  const resultado = await query(
    `SELECT id_dispensacao, id_receita_externa, id_paciente_externo, data_dispensacao, status, valor_total
     FROM dispensacao ${where}
     ORDER BY data_dispensacao DESC
     LIMIT ${limite} OFFSET ${offset}`,
    valores
  );

  return res.json({
    pagina,
    totalPages: Math.ceil(totalRegistros / limite) || 1,
    totalRegistros,
    dados: resultado.rows
  });
}

export async function detalharDispensacao(req, res) {
  const { id } = req.params;

  const cabecalho = await query(
    'SELECT id_dispensacao, id_receita_externa, id_paciente_externo, data_dispensacao, status, valor_total FROM dispensacao WHERE id_dispensacao = $1',
    [id]
  );

  if (cabecalho.rowCount === 0) {
    return res.status(404).json({ erro: 'Dispensacao nao encontrada' });
  }

  const itens = await query(
    `SELECT i.id_medicamento, m.nome_comercial, i.quantidade, i.dosagem, i.preco_unitario, i.subtotal
     FROM item_dispensacao i
     JOIN medicamento m ON m.id_medicamento = i.id_medicamento
     WHERE i.id_dispensacao = $1`,
    [id]
  );

  return res.json({ ...cabecalho.rows[0], itens: itens.rows });
}

export async function marcarFaturado(req, res) {
  const { id } = req.params;

  const resultado = await query(
    "UPDATE dispensacao SET status = 'faturado' WHERE id_dispensacao = $1 AND status = 'pendente_faturamento' RETURNING id_dispensacao, status",
    [id]
  );

  if (resultado.rowCount === 0) {
    return res.status(404).json({ erro: 'Dispensacao nao encontrada ou ja faturada' });
  }

  await query(
    'INSERT INTO log_auditoria (id_dispensacao, id_usuario, operacao, resultado, detalhe) VALUES ($1, $2, $3, $4, $5)',
    [id, req.usuario.id, 'FATURAMENTO', 'SUCESSO', 'Marcada como faturada']
  );

  return res.json(resultado.rows[0]);
}

export async function listarReceitasG6(req, res) {
  try {
    const { buscarTodasReceitas } = await import('../services/g6Service.js');
    const receitas = await buscarTodasReceitas();
    return res.json(receitas);
  } catch (e) {
    return res.status(503).json({ erro: 'Modulo G6 indisponivel.' });
  }
}