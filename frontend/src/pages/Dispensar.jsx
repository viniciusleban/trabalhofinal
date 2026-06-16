import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

export default function Dispensar() {
  const [idReceita, setIdReceita] = useState('');
  const [receita, setReceita] = useState(null);
  const [receitasG6, setReceitasG6] = useState([]);
  const [carregandoReceitas, setCarregandoReceitas] = useState(true);
  const [busca, setBusca] = useState('');
  const [medicamentos, setMedicamentos] = useState([]);
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [validando, setValidando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [validado, setValidado] = useState(false);

  useEffect(() => {
    api.listarMedicamentos().then(setMedicamentos).catch(() => {});
    api.listarReceitasG6()
      .then(setReceitasG6)
      .catch(() => setReceitasG6([]))
      .finally(() => setCarregandoReceitas(false));
  }, []);

  const receitasFiltradas = receitasG6.filter((r) =>
    busca === '' ||
    String(r.idreceita).includes(busca) ||
    String(r.paciente_id).includes(busca) ||
    r.profissional?.toLowerCase().includes(busca.toLowerCase())
  );

  async function validar(codigoOverride) {
    const codigo = codigoOverride || idReceita;
    setErro('');
    setSucesso('');
    setReceita(null);
    setValidado(false);
    setValidando(true);
    if (codigoOverride) setIdReceita(codigoOverride);
    try {
      const resp = await api.validarReceita(codigo);
      if (!resp || !resp.receita) {
        setErro('Receita não encontrada ou inválida no módulo G6.');
        return;
      }
      setReceita(resp.receita);
      setItens([{ idMedicamento: '', quantidade: 1, dosagem: '' }]);
    } catch (e) {
      setErro(e.message || 'Não foi possível conectar ao módulo de receitas (G6).');
    } finally {
      setValidando(false);
      setValidado(true);
    }
  }

  function atualizarItem(indice, campo, valor) {
    const copia = [...itens];
    copia[indice][campo] = valor;
    setItens(copia);
  }

  function adicionarItem() {
    setItens([...itens, { idMedicamento: '', quantidade: 1, dosagem: '' }]);
  }

  function removerItem(indice) {
    setItens(itens.filter((_, i) => i !== indice));
  }

  async function registrar() {
    setErro('');
    setSucesso('');
    const itensValidos = itens.filter((i) => i.idMedicamento && i.quantidade > 0);
    if (itensValidos.length === 0) {
      setErro('Adicione ao menos um medicamento.');
      return;
    }
    setSalvando(true);
    try {
      const resp = await api.registrarDispensacao({
        idReceita,
        itens: itensValidos.map((i) => ({
          idMedicamento: Number(i.idMedicamento),
          quantidade: Number(i.quantidade),
          dosagem: i.dosagem,
        })),
      });
      setSucesso(`Dispensação #${resp.idDispensacao} registrada. Total: R$ ${resp.valorTotal.toFixed(2)}`);
      setReceita(null);
      setIdReceita('');
      setItens([]);
      setValidado(false);
      setBusca('');
      api.listarMedicamentos().then(setMedicamentos);
      api.listarReceitasG6().then(setReceitasG6).catch(() => {});
    } catch (e) {
      setErro(e.message || 'Erro ao registrar dispensação.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: '0.3rem' }}>Nova dispensação</h1>
      <p style={{ color: 'var(--tinta-suave)', marginBottom: '1.8rem' }}>
        Selecione uma receita pendente ou informe o código manualmente.
      </p>

      {erro && <div className="alerta alerta-erro">{erro}</div>}
      {sucesso && <div className="alerta alerta-ok">{sucesso}</div>}
      {validado && !receita && !erro && (
        <div className="alerta alerta-erro">
          Receita não encontrada ou módulo G6 indisponível. Verifique o código informado.
        </div>
      )}

      {/* Lista de receitas pendentes */}
      {!receita && (
        <div className="cartao" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '1rem' }}>Receitas pendentes (G6)</div>

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por ID, paciente ou profissional..."
            style={{ marginBottom: '1rem' }}
          />

          {carregandoReceitas ? (
            <div style={{ color: 'var(--tinta-suave)', fontSize: '0.9rem' }}>Carregando receitas...</div>
          ) : receitasFiltradas.length === 0 ? (
            <div className="vazio">Nenhuma receita encontrada.</div>
          ) : (
            <table className="tabela">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Paciente</th>
                  <th>Profissional</th>
                  <th>Emitida em</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {receitasFiltradas.map((r) => (
                  <tr key={r.codigo}>
                    <td>#{r.idreceita}</td>
                    <td>#{r.paciente_id}</td>
                    <td>{r.profissional}</td>
                    <td>{new Date(r.emitida_em).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <button
                        className="btn-secundario"
                        onClick={() => validar(r.codigo)}
                        disabled={validando}
                      >
                        Selecionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Busca manual por código UUID */}
      {!receita && (
        <div className="cartao" style={{ marginBottom: '1.5rem' }}>
          <label>Ou informe o código UUID manualmente</label>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <input
              value={idReceita}
              onChange={(e) => { setIdReceita(e.target.value); setValidado(false); setErro(''); }}
              placeholder="Ex.: c6ab41ea-1ed4-47b3-a19c-29a774f3f5d9"
            />
            <button
              className="btn-primario"
              onClick={() => validar()}
              disabled={validando || !idReceita.trim()}
              style={{ whiteSpace: 'nowrap' }}
            >
              {validando ? 'Validando...' : 'Validar receita'}
            </button>
          </div>
        </div>
      )}

      {/* Formulário de dispensação */}
      {receita && (
        <div className="cartao">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--tinta-suave)' }}>Receita validada</div>
              <div style={{ fontWeight: 600 }}>Paciente #{receita.pacienteId}</div>
              {receita.profissional && (
                <div style={{ fontSize: '0.85rem', color: 'var(--tinta-suave)' }}>
                  Dr(a). {receita.profissional} — CRM {receita.crm}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <button className="btn-secundario" onClick={() => { setReceita(null); setItens([]); setErro(''); setValidado(false); }}>
                Trocar receita
              </button>
              <span className="etiqueta etiqueta-faturado">Válida</span>
            </div>
          </div>

          {receita.itens && receita.itens.length > 0 && (
            <div style={{ background: 'var(--area)', borderRadius: 'var(--raio)', padding: '0.8rem 1rem', marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tinta-suave)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Medicamentos prescritos na receita
              </div>
              {receita.itens.map((item, i) => (
                <div key={i} style={{ fontSize: '0.88rem', color: 'var(--tinta)', padding: '0.2rem 0' }}>
                  • {item.medicamento} {item.dosagem} — {item.posologia} (qtd: {item.quantidade})
                </div>
              ))}
            </div>
          )}

          <h3 style={{ fontSize: '1rem', marginBottom: '0.8rem' }}>Medicamentos a dispensar</h3>

          {itens.map((item, indice) => (
            <div key={indice} style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.7rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 2 }}>
                <label>Medicamento</label>
                <select value={item.idMedicamento} onChange={(e) => atualizarItem(indice, 'idMedicamento', e.target.value)}>
                  <option value="">Selecione</option>
                  {medicamentos.map((m) => (
                    <option key={m.id_medicamento} value={m.id_medicamento}>
                      {m.nome_comercial} {m.concentracao} (estoque: {m.estoque_atual})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label>Quantidade</label>
                <input type="number" min="1" value={item.quantidade} onChange={(e) => atualizarItem(indice, 'quantidade', e.target.value)} />
              </div>
              <div style={{ flex: 2 }}>
                <label>Dosagem</label>
                <input value={item.dosagem} onChange={(e) => atualizarItem(indice, 'dosagem', e.target.value)} placeholder="Ex.: 1 comp. 8/8h" />
              </div>
              <button className="btn-secundario" onClick={() => removerItem(indice)} style={{ marginBottom: '0.05rem' }}>
                Remover
              </button>
            </div>
          ))}

          <button className="btn-secundario" onClick={adicionarItem} style={{ marginTop: '0.3rem', marginBottom: '1.3rem' }}>
            + Adicionar medicamento
          </button>

          <button className="btn-primario" onClick={registrar} disabled={salvando}>
            {salvando ? 'Registrando...' : 'Confirmar dispensação'}
          </button>
        </div>
      )}
    </div>
  );
}
