import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.G6_BASE_URL;       // http://localhost:3006
const LOGIN_EMAIL = process.env.G6_LOGIN_EMAIL;
const LOGIN_PASSWORD = process.env.G6_LOGIN_PASSWORD;

let cachedToken = null;

async function autenticar() {
  // Remove o cache — G6 usa token por sessão no banco
  const resposta = await fetch(`${BASE_URL}/usuario/login`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LOGIN_EMAIL, senha: LOGIN_PASSWORD })
  });

  if (!resposta.ok) throw new Error('Falha ao autenticar no modulo G6');

  const dados = await resposta.json();
  if (dados.erro) throw new Error('Credenciais invalidas no G6');

  return dados.token;
}

export async function buscarReceita(codigo) {
  const token = await autenticar();
  console.log('Token G6:', token);

  const resposta = await fetch(`${BASE_URL}/receita/validar/${codigo}`, {
    headers: { token }
  });

  console.log('Status validar:', resposta.status);

  if (!resposta.ok) throw new Error('Erro ao consultar receita no modulo G6');

  const dados = await resposta.json();

  if (!dados.valida) return null;

  let itens = dados.receita.itens ?? [];

  if (itens.length === 0) {
    try {
      const todasReceitas = await fetch(`${BASE_URL}/receita`, { headers: { token } });
      console.log('Status lista:', todasReceitas.status);
      const lista = await todasReceitas.json();
      console.log('Lista G6:', JSON.stringify(lista).substring(0, 300));
      const receitaCompleta = lista.find(r => r.codigo === codigo);
      console.log('Receita encontrada:', receitaCompleta);

      if (receitaCompleta) {
        const detalhe = await fetch(`${BASE_URL}/receita/${receitaCompleta.idreceita}`, { headers: { token } });
        const dadosDetalhe = await detalhe.json();
        itens = dadosDetalhe.itens ?? [];
      }
    } catch (e) {
      console.warn('Nao foi possivel buscar itens da receita:', e.message);
    }
  }

  return {
    id: dados.receita.codigo,
    pacienteId: dados.receita.paciente_id,
    profissional: dados.receita.profissional,
    crm: dados.receita.crm,
    emitida_em: dados.receita.emitida_em,
    itens
  };
}

export function receitaEhValida(receita) {
  if (!receita) return { valida: false, motivo: 'Receita nao encontrada ou invalida' };
  if (!receita.pacienteId) return { valida: false, motivo: 'Receita sem paciente vinculado' };
  return { valida: true, motivo: null };
}

export async function marcarReceitaDispensada(codigo) {
  try {
    const token = await autenticar();

    const resposta = await fetch(`${BASE_URL}/receita/dispensar/${codigo}`, {
      method: 'POST',
      headers: { token }
    });

    if (!resposta.ok) {
      console.warn(`Aviso: nao foi possivel marcar receita ${codigo} como dispensada no G6`);
    }
  } catch (e) {
    console.warn(`Aviso: erro ao notificar G6 sobre dispensacao: ${e.message}`);
  }
}

export async function buscarTodasReceitas() {
  const token = await autenticar();
  const resposta = await fetch(`${BASE_URL}/receita`, { headers: { token } });
  if (!resposta.ok) throw new Error('Erro ao listar receitas do G6');
  const lista = await resposta.json();
  return lista.filter(r => r.status === 'ativa');
}