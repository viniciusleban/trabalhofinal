import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

function Etiqueta({ status }) {
  const classe = {
    pendente_faturamento: 'etiqueta-pendente',
    faturado: 'etiqueta-faturado',
    cancelado: 'etiqueta-cancelado'
  }[status] || 'etiqueta-pendente';
  const texto = {
    pendente_faturamento: 'Pendente',
    faturado: 'Faturado',
    cancelado: 'Cancelado'
  }[status] || status;
  return <span className={`etiqueta ${classe}`}>{texto}</span>;
}

export default function Historico() {
  const [dispensacoes, setDispensacoes] = useState([]);
  const [pacienteId, setPacienteId] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [detalhe, setDetalhe] = useState(null);

  function carregar(filtros = {}) {
    setCarregando(true);
    api.listarDispensacoes(filtros)
      .then((r) => setDispensacoes(r.dados))
      .finally(() => setCarregando(false));
  }

  useEffect(() => { carregar(); }, []);

  function filtrar() {
    carregar(pacienteId ? { pacienteId } : {});
  }

  async function abrirDetalhe(id) {
    const d = await api.detalharDispensacao(id);
    setDetalhe(d);
  }

  return (
    <div>
      <h1 style={{ marginBottom: '0.3rem' }}>Histórico de dispensações</h1>
      <p style={{ color: 'var(--tinta-suave)', marginBottom: '1.8rem' }}>
        Consulte e audite os medicamentos já dispensados.
      </p>

      <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '1.5rem', maxWidth: '500px' }}>
        <input value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} placeholder="Filtrar por ID do paciente" />
        <button className="btn-primario" onClick={filtrar} style={{ whiteSpace: 'nowrap' }}>Filtrar</button>
      </div>

      <div className="cartao" style={{ padding: 0 }}>
        {carregando ? (
          <div className="vazio">Carregando...</div>
        ) : dispensacoes.length === 0 ? (
          <div className="vazio">Nenhuma dispensação encontrada.</div>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>#</th>
                <th>Receita</th>
                <th>Paciente</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dispensacoes.map((d) => (
                <tr key={d.id_dispensacao}>
                  <td>{d.id_dispensacao}</td>
                  <td>{d.id_receita_externa}</td>
                  <td>{d.id_paciente_externo}</td>
                  <td>{new Date(d.data_dispensacao).toLocaleString('pt-BR')}</td>
                  <td>R$ {Number(d.valor_total).toFixed(2)}</td>
                  <td><Etiqueta status={d.status} /></td>
                  <td>
                    <button className="btn-secundario" onClick={() => abrirDetalhe(d.id_dispensacao)}>Ver itens</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detalhe && (
        <div
          onClick={() => setDetalhe(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,46,46,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div className="cartao" style={{ width: '520px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem' }}>Dispensação #{detalhe.id_dispensacao}</h3>
            <table className="tabela">
              <thead>
                <tr><th>Medicamento</th><th>Qtd</th><th>Dosagem</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                {detalhe.itens.map((i, idx) => (
                  <tr key={idx}>
                    <td>{i.nome_comercial}</td>
                    <td>{i.quantidade}</td>
                    <td>{i.dosagem}</td>
                    <td>R$ {Number(i.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn-primario" onClick={() => setDetalhe(null)} style={{ marginTop: '1.2rem' }}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
