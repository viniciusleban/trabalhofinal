const API_URL = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(caminho, opcoes = {}) {
  const headers = { 'Content-Type': 'application/json', ...opcoes.headers };
  const token = getToken();
  const deveRedirecionarAoReceber401 = Boolean(token);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resposta = await fetch(`${API_URL}${caminho}`, { ...opcoes, headers });

  const dados = await resposta.json().catch(() => ({}));

  if (resposta.status === 401) {
    if (deveRedirecionarAoReceber401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
      throw new Error('Sessão expirada');
    }

    throw new Error(dados.erro || 'Credenciais inválidas');
  }

  if (!resposta.ok) {
    throw new Error(dados.erro || 'Erro na requisição');
  }

  return dados;
}

export const api = {
  login: (email, senha) =>
    request('/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),

  listarMedicamentos: () => request('/medicamentos'),

  criarMedicamento: (dados) =>
    request('/medicamentos', { method: 'POST', body: JSON.stringify(dados) }),

  validarReceita: (idReceita) => request(`/receitas/${idReceita}/validar`),

  registrarDispensacao: (dados) =>
    request('/dispensacoes', { method: 'POST', body: JSON.stringify(dados) }),

  listarDispensacoes: (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    return request(`/dispensacoes${params ? `?${params}` : ''}`);
  },

  detalharDispensacao: (id) => request(`/dispensacoes/${id}`)
};

export const listarReceitas = async () => {
  return []; 
};