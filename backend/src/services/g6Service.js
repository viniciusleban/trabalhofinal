import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.G6_BASE_URL;
const LOGIN_EMAIL = process.env.G6_LOGIN_EMAIL;
const LOGIN_PASSWORD = process.env.G6_LOGIN_PASSWORD;

let cachedToken = null;
let tokenExpiraEm = 0;

async function autenticar() {
  const agora = Date.now();
  if (cachedToken && agora < tokenExpiraEm) {
    return cachedToken;
  }

  const resposta = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LOGIN_EMAIL, senha: LOGIN_PASSWORD })
  });

  if (!resposta.ok) {
    throw new Error('Falha ao autenticar no modulo G6');
  }

  const dados = await resposta.json();
  cachedToken = dados.token;
  tokenExpiraEm = agora + 1000 * 60 * 30;
  return cachedToken;
}

function normalizarReceita(dados) {
  return {
    id: dados.id ?? dados.id_receita ?? dados.receitaId,
    pacienteId: dados.pacienteId ?? dados.id_paciente ?? dados.paciente_id,
    status: dados.status ?? dados.situacao,
    dataEmissao: dados.dataEmissao ?? dados.data_emissao ?? dados.criadoEm,
    itens: dados.itens ?? dados.medicamentos ?? []
  };
}

export async function buscarReceita(idReceita) {
  const token = await autenticar();

  const resposta = await fetch(`${BASE_URL}/receitas/${idReceita}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (resposta.status === 404) {
    return null;
  }

  if (!resposta.ok) {
    throw new Error('Erro ao consultar receita no modulo G6');
  }

  const dados = await resposta.json();
  return normalizarReceita(dados);
}

export function receitaEhValida(receita) {
  if (!receita) {
    return { valida: false, motivo: 'Receita nao encontrada' };
  }
  if (receita.status && String(receita.status).toLowerCase() === 'dispensada') {
    return { valida: false, motivo: 'Receita ja dispensada' };
  }
  if (receita.status && String(receita.status).toLowerCase() === 'cancelada') {
    return { valida: false, motivo: 'Receita cancelada' };
  }
  if (!receita.pacienteId) {
    return { valida: false, motivo: 'Receita sem paciente vinculado' };
  }
  return { valida: true, motivo: null };
}

export async function marcarReceitaDispensada(idReceita) {
  const token = await autenticar();

  const resposta = await fetch(`${BASE_URL}/receitas/${idReceita}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'dispensada' })
  });

  if (!resposta.ok) {
    console.warn(`Aviso: nao foi possivel atualizar status da receita ${idReceita} no G6`);
  }
}