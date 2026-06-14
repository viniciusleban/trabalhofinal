import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

const vazio = {
  nomeComercial: '', principioAtivo: '', formaFarmaceutica: '',
  concentracao: '', unidadeMedida: '', precoUnitario: '', estoqueAtual: ''
};

export default function Medicamentos() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(vazio);
  const [erro, setErro] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  function carregar() {
    api.listarMedicamentos().then(setLista).catch(() => {});
  }

  useEffect(() => { carregar(); }, []);

  function atualizar(campo, valor) {
    setForm({ ...form, [campo]: valor });
  }

  async function salvar() {
    setErro('');
    try {
      await api.criarMedicamento({
        ...form,
        precoUnitario: Number(form.precoUnitario) || 0,
        estoqueAtual: Number(form.estoqueAtual) || 0
      });
      setForm(vazio);
      setMostrarForm(false);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.8rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.3rem' }}>Medicamentos</h1>
          <p style={{ color: 'var(--tinta-suave)' }}>Catálogo e estoque da farmácia.</p>
        </div>
        <button className="btn-primario" onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? 'Cancelar' : '+ Novo medicamento'}
        </button>
      </div>

      {erro && <div className="alerta alerta-erro">{erro}</div>}

      {mostrarForm && (
        <div className="cartao" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="campo"><label>Nome comercial</label><input value={form.nomeComercial} onChange={(e) => atualizar('nomeComercial', e.target.value)} /></div>
            <div className="campo"><label>Princípio ativo</label><input value={form.principioAtivo} onChange={(e) => atualizar('principioAtivo', e.target.value)} /></div>
            <div className="campo"><label>Forma farmacêutica</label><input value={form.formaFarmaceutica} onChange={(e) => atualizar('formaFarmaceutica', e.target.value)} placeholder="Comprimido, cápsula..." /></div>
            <div className="campo"><label>Concentração</label><input value={form.concentracao} onChange={(e) => atualizar('concentracao', e.target.value)} placeholder="500mg" /></div>
            <div className="campo"><label>Unidade de medida</label><input value={form.unidadeMedida} onChange={(e) => atualizar('unidadeMedida', e.target.value)} placeholder="comprimido" /></div>
            <div className="campo"><label>Preço unitário (R$)</label><input type="number" step="0.01" value={form.precoUnitario} onChange={(e) => atualizar('precoUnitario', e.target.value)} /></div>
            <div className="campo"><label>Estoque inicial</label><input type="number" value={form.estoqueAtual} onChange={(e) => atualizar('estoqueAtual', e.target.value)} /></div>
          </div>
          <button className="btn-primario" onClick={salvar}>Salvar medicamento</button>
        </div>
      )}

      <div className="cartao" style={{ padding: 0 }}>
        {lista.length === 0 ? (
          <div className="vazio">Nenhum medicamento cadastrado.</div>
        ) : (
          <table className="tabela">
            <thead>
              <tr><th>Nome</th><th>Princípio ativo</th><th>Concentração</th><th>Preço</th><th>Estoque</th></tr>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
