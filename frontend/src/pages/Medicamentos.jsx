import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

const vazio = {
  nomeComercial: '', principioAtivo: '', formaFarmaceutica: '',
  concentracao: '', unidadeMedida: '', precoUnitario: '', estoqueAtual: ''
};

export default function Medicamentos() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(vazio);
  const [editando, setEditando] = useState(null); // id do medicamento em edição
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(null);

  function carregar() {
    api.listarMedicamentos().then(setLista).catch(() => {});
  }

  useEffect(() => { carregar(); }, []);

  function atualizar(campo, valor) {
    setForm({ ...form, [campo]: valor });
  }

  function abrirNovo() {
    setForm(vazio);
    setEditando(null);
    setErro('');
    setSucesso('');
    setMostrarForm(true);
  }

  function abrirEdicao(m) {
    setForm({
      nomeComercial: m.nome_comercial,
      principioAtivo: m.principio_ativo,
      formaFarmaceutica: m.forma_farmaceutica,
      concentracao: m.concentracao,
      unidadeMedida: m.unidade_medida,
      precoUnitario: m.preco_unitario,
      estoqueAtual: m.estoque_atual,
    });
    setEditando(m.id_medicamento);
    setErro('');
    setSucesso('');
    setMostrarForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelar() {
    setForm(vazio);
    setEditando(null);
    setErro('');
    setMostrarForm(false);
  }

  async function salvar() {
    setErro('');
    setSucesso('');
    const dados = {
      ...form,
      precoUnitario: Number(form.precoUnitario) || 0,
      estoqueAtual: Number(form.estoqueAtual) || 0,
    };
    try {
      if (editando) {
        await api.atualizarMedicamento(editando, dados);
        setSucesso('Medicamento atualizado com sucesso.');
      } else {
        await api.criarMedicamento(dados);
        setSucesso('Medicamento cadastrado com sucesso.');
      }
      setForm(vazio);
      setEditando(null);
      setMostrarForm(false);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function excluir(id) {
    setErro('');
    setSucesso('');
    try {
      await api.excluirMedicamento(id);
      setSucesso('Medicamento excluído com sucesso.');
      setConfirmandoExclusao(null);
      carregar();
    } catch (e) {
      setErro(e.message);
      setConfirmandoExclusao(null);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.8rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.3rem' }}>Medicamentos</h1>
          <p style={{ color: 'var(--tinta-suave)' }}>Catálogo e estoque da farmácia.</p>
        </div>
        {!mostrarForm && (
          <button className="btn-primario" onClick={abrirNovo}>
            + Novo medicamento
          </button>
        )}
      </div>

      {erro && <div className="alerta alerta-erro">{erro}</div>}
      {sucesso && <div className="alerta alerta-ok">{sucesso}</div>}

      {/* Formulário novo/edição */}
      {mostrarForm && (
        <div className="cartao" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '1rem' }}>
            {editando ? 'Editar medicamento' : 'Novo medicamento'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="campo">
              <label>Nome comercial</label>
              <input value={form.nomeComercial} onChange={(e) => atualizar('nomeComercial', e.target.value)} />
            </div>
            <div className="campo">
              <label>Princípio ativo</label>
              <input value={form.principioAtivo} onChange={(e) => atualizar('principioAtivo', e.target.value)} />
            </div>
            <div className="campo">
              <label>Forma farmacêutica</label>
              <input value={form.formaFarmaceutica} onChange={(e) => atualizar('formaFarmaceutica', e.target.value)} placeholder="Comprimido, cápsula..." />
            </div>
            <div className="campo">
              <label>Concentração</label>
              <input value={form.concentracao} onChange={(e) => atualizar('concentracao', e.target.value)} placeholder="500mg" />
            </div>
            <div className="campo">
              <label>Unidade de medida</label>
              <input value={form.unidadeMedida} onChange={(e) => atualizar('unidadeMedida', e.target.value)} placeholder="comprimido" />
            </div>
            <div className="campo">
              <label>Preço unitário (R$)</label>
              <input type="number" step="0.01" value={form.precoUnitario} onChange={(e) => atualizar('precoUnitario', e.target.value)} />
            </div>
            <div className="campo">
              <label>Estoque</label>
              <input type="number" value={form.estoqueAtual} onChange={(e) => atualizar('estoqueAtual', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
            <button className="btn-primario" onClick={salvar}>
              {editando ? 'Salvar alterações' : 'Cadastrar medicamento'}
            </button>
            <button className="btn-secundario" onClick={cancelar}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmandoExclusao && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="cartao" style={{ maxWidth: '400px', width: '90%' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Confirmar exclusão</div>
            <p style={{ color: 'var(--tinta-suave)', marginBottom: '1.2rem', fontSize: '0.95rem' }}>
              Tem certeza que deseja excluir <strong>{confirmandoExclusao.nome}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                className="btn-primario"
                style={{ background: 'var(--vermelho)' }}
                onClick={() => excluir(confirmandoExclusao.id)}
              >
                Sim, excluir
              </button>
              <button className="btn-secundario" onClick={() => setConfirmandoExclusao(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="cartao" style={{ padding: 0 }}>
        {lista.length === 0 ? (
          <div className="vazio">Nenhum medicamento cadastrado.</div>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Princípio ativo</th>
                <th>Concentração</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((m) => (
                <tr key={m.id_medicamento}>
                  <td>{m.nome_comercial}</td>
                  <td>{m.principio_ativo}</td>
                  <td>{m.concentracao}</td>
                  <td>R$ {Number(m.preco_unitario).toFixed(2)}</td>
                  <td style={{ color: m.estoque_atual === 0 ? 'var(--vermelho)' : 'inherit', fontWeight: m.estoque_atual === 0 ? 600 : 400 }}>
                    {m.estoque_atual}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-secundario" onClick={() => abrirEdicao(m)}>Editar</button>
                      <button
                        className="btn-secundario"
                        style={{ color: 'var(--vermelho)' }}
                        onClick={() => setConfirmandoExclusao({ id: m.id_medicamento, nome: m.nome_comercial })}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
