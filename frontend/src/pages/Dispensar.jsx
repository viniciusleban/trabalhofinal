import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

export default function Dispensar() {
  const [idReceita, setIdReceita] = useState('');
  const [receita, setReceita] = useState(null);
  const [medicamentos, setMedicamentos] = useState([]);
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [validando, setValidando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api.listarMedicamentos().then(setMedicamentos).catch(() => {});

    async function checarReceitas() {
      try {
        const resposta = await api.listarReceitas();

        if (!resposta || resposta.length === 0) {
          setErro('Nenhuma receita pendente encontrada no módulo de receitas.');
        } 

      } catch (e) {
        setErro('Não foi possível buscar a lista de receitas no módulo de receitas (G6).');
      }
    }

    checarReceitas();
  }, []);

  async function validar() {
    setErro('');
    setSucesso('');
    setReceita(null);
    setValidando(true);
    
    try {
      const resp = await api.validarReceita(idReceita);

      if (!resp || !resp.receita) {
        setErro('Nenhuma receita encontrada com o ID informado no módulo de receitas (G6).');
        return;
      }
      
      setReceita(resp.receita);
      setItens([{ idMedicamento: '', quantidade: 1, dosagem: '' }]);
    } catch (e) {
      console.error("Erro na validação:", e);

      if (e.response) {
        if (e.response.status === 404) {
          setErro('Receita não encontrada no sistema. Verifique o ID informado.');
        } else if (e.response.status === 500) {
          setErro('O módulo de receitas (G6) encontrou um erro interno. Tente novamente.');
        } else {
          setErro(e.response.data?.message || 'Erro ao validar a receita com o módulo externo.');
        }
      } else {
        setErro('Não foi possível conectar ao módulo de receitas (G6).');
      }
    } finally {
      setValidando(false);
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
      setErro('Adicione ao menos um medicamento');
      return;
    }
    setSalvando(true);
    try {
      const resp = await api.registrarDispensacao({
        idReceita,
        itens: itensValidos.map((i) => ({
          idMedicamento: Number(i.idMedicamento),
          quantidade: Number(i.quantidade),
          dosagem: i.dosagem
        }))
      });
      setSucesso(`Dispensação #${resp.idDispensacao} registrada. Total: R$ ${resp.valorTotal.toFixed(2)}`);
      setReceita(null);
      setIdReceita('');
      setItens([]);
      api.listarMedicamentos().then(setMedicamentos);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: '0.3rem' }}>Nova dispensação</h1>
      <p style={{ color: 'var(--tinta-suave)', marginBottom: '1.8rem' }}>
        Valide a receita do módulo de Receitas antes de liberar os medicamentos.
      </p>

      {erro && <div className="alerta alerta-erro">{erro}</div>}
      {sucesso && <div className="alerta alerta-ok">{sucesso}</div>}

      <div className="cartao" style={{ marginBottom: '1.5rem' }}>
        <label>Número da receita</label>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <input
            value={idReceita}
            onChange={(e) => setIdReceita(e.target.value)}
            placeholder="Informe o ID da receita emitida no G6"
          />
          <button className="btn-primario" onClick={validar} disabled={validando || !idReceita} style={{ whiteSpace: 'nowrap' }}>
            {validando ? 'Validando...' : 'Validar receita'}
          </button>
        </div>
      </div>

      {receita && (
        <div className="cartao">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--tinta-suave)' }}>Receita validada</div>
              <div style={{ fontWeight: 600 }}>Paciente #{receita.pacienteId}</div>
            </div>
            <span className="etiqueta etiqueta-faturado">Válida</span>
          </div>

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
              <button className="btn-secundario" onClick={() => removerItem(indice)} style={{ marginBottom: '0.05rem' }}>Remover</button>
            </div>
          ))}

          <button className="btn-secundario" onClick={adicionarItem} style={{ marginTop: '0.3rem', marginBottom: '1.3rem' }}>
            + Adicionar medicamento
          </button>

          <div>
            <button className="btn-primario" onClick={registrar} disabled={salvando}>
              {salvando ? 'Registrando...' : 'Confirmar dispensação'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
