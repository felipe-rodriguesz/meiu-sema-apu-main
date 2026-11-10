import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import api from '../../services/api';
import './Relatorios.css';

type Totais = { registros: number; pendentes: number; recebidos: number; peso_declarado_kg: number; peso_recebido_kg: number };
type Grupo = Totais & { chave: string; nome: string };
type Registro = { id: string; protocolo: string; criado_em: string; situacao: string; ponto_nome: string | null; residuo_principal: string | null; quantidade_kg: number | null; peso_recebido_kg: number | null; recebido_em: string | null };
type Relatorio = { totais: Totais; por_ponto: Grupo[]; por_residuo: Grupo[]; registros: Registro[] };
type Filtros = { inicio: string; fim: string; base_data: string; ponto_coleta_id: string; residuo_principal: string; situacao: string };
const inicial: Filtros = { inicio: '', fim: '', base_data: 'registro', ponto_coleta_id: '', residuo_principal: '', situacao: '' };
const kg = (v: number | null) => v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const data = (v: string) => v ? v.replace(/^(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1').replace('T', ' ') : '—';
const params = (f: Filtros) => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
const mensagem = (e: unknown) => axios.isAxiosError(e) ? [].concat(e.response?.data?.message || 'Não foi possível carregar o relatório.').join(' ') : 'Não foi possível carregar o relatório.';

function Agrupamento({ titulo, grupos }: { titulo: string; grupos: Grupo[] }) {
  return <section><h3>{titulo}</h3><div className="relatorio-tabela" tabIndex={0} role="region" aria-label={titulo}><table><thead><tr><th>Grupo</th><th>Registros</th><th>Pendentes</th><th>Recebidos</th><th>Declarado (kg)</th><th>Recebido (kg)</th></tr></thead>
    <tbody>{grupos.map(g => <tr key={g.chave}><th scope="row">{g.nome}</th><td>{g.registros}</td><td>{g.pendentes}</td><td>{g.recebidos}</td><td>{kg(g.peso_declarado_kg)}</td><td>{kg(g.peso_recebido_kg)}</td></tr>)}</tbody></table></div>{!grupos.length && <p>Nenhum resultado.</p>}</section>;
}
export default function Relatorios() {
  const [filtros, setFiltros] = useState<Filtros>(inicial);
  const [aplicados, setAplicados] = useState<Filtros>(inicial);
  const [dados, setDados] = useState<Relatorio | null>(null);
  const [pontos, setPontos] = useState<{id: string; nome: string}[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [limite, setLimite] = useState(100);
  const request = useRef(0);
  const alterados = Object.keys(inicial).some(k => filtros[k as keyof Filtros] !== aplicados[k as keyof Filtros]);
  const consultar = useCallback((f: Filtros) => {
    const id = ++request.current;
    return api.get<Relatorio>('/relatorios', { params: params(f) }).then(res => {
      if (id !== request.current) return;
      setDados(res.data); setAplicados({ ...f }); setLimite(100);
    }).catch(e => { if (id === request.current) { setErro(mensagem(e)); setDados(null); } })
      .finally(() => { if (id === request.current) setCarregando(false); });
  }, []);
  function carregar(f: Filtros) {
    if (f.inicio && f.fim && f.inicio > f.fim) { setErro('A data final deve ser igual ou posterior à data inicial.'); return; }
    setErro(''); setCarregando(true);
    return consultar(f);
  }
  useEffect(() => {
    const controle = request;
    void consultar(inicial);
    api.get('/pontos-coleta/admin').then(r => setPontos(r.data)).catch(() => setErro('Não foi possível carregar a lista de pontos. Atualize a página.'));
    return () => { controle.current++; };
  }, [consultar]);
  function campo(key: keyof Filtros, value: string) { setFiltros(f => ({ ...f, [key]: value })); }
  async function exportar() {
    setExportando(true); setErro('');
    try {
      const res = await api.get('/relatorios/csv', { params: params(aplicados), responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = 'relatorio-residuos.csv'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setErro('Não foi possível exportar. Confira sua conexão e tente novamente.'); }
    finally { setExportando(false); }
  }
  return <div className="relatorios">
    <header className="painel-cabecalho"><div><h2>Relatórios de resíduos têxteis</h2>
    <p>Acompanhe os pedidos, os recebimentos e os pesos. Filtre os resultados e exporte para o Excel.</p></div></header>
    <h3 className="painel-subtitulo">Filtrar relatório</h3>
    <form className="relatorio-filtros" onSubmit={e => { e.preventDefault(); void carregar(filtros); }}>
      <label>Período por<select value={filtros.base_data} onChange={e => campo('base_data', e.target.value)}><option value="registro">Data do registro (São Paulo)</option><option value="recebimento">Data do recebimento (São Paulo)</option></select></label>
      <label>De<input type="date" value={filtros.inicio} onChange={e => campo('inicio', e.target.value)} /></label>
      <label>Até<input type="date" value={filtros.fim} onChange={e => campo('fim', e.target.value)} /></label>
      <label>Ponto de coleta<select value={filtros.ponto_coleta_id} onChange={e => campo('ponto_coleta_id', e.target.value)}><option value="">Todos</option>{pontos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
      <label>Tipo de resíduo<input value={filtros.residuo_principal} onChange={e => campo('residuo_principal', e.target.value)} list="tipos-residuo" placeholder="Todos (vazio)" /></label>
      <datalist id="tipos-residuo">{dados?.por_residuo.map(r => <option key={r.chave} value={r.chave} />)}</datalist>
      <label>Situação<select value={filtros.situacao} onChange={e => campo('situacao', e.target.value)}><option value="">Todas</option><option value="PENDENTE">Pendente</option><option value="RECEBIDO">Recebido</option></select></label>
      <div className="relatorio-acoes"><button disabled={carregando} type="submit">{carregando ? 'Carregando...' : 'Aplicar filtros'}</button>
      <button className="painel-secundario" disabled={carregando} type="button" onClick={() => { setFiltros(inicial); void carregar(inicial); }}>Limpar filtros</button></div>
      {filtros.base_data === 'recebimento' && <p className="relatorio-aviso">O período de recebimento considera apenas pedidos já recebidos, no horário de São Paulo.</p>}
    </form>
    {alterados && <p className="relatorio-aviso" role="status">Filtros alterados. Clique em Aplicar filtros para atualizar os resultados e o CSV.</p>}
    {carregando && <p role="status">Carregando relatório...</p>}
    {erro && <p role="alert">{erro}</p>}
    {dados && <div aria-busy={carregando}>
      <div className="relatorio-aplicados" aria-label="Filtros aplicados"><strong>Resultados exibidos</strong>
        <span>{aplicados.base_data === 'registro' ? 'Data do registro (São Paulo)' : 'Data do recebimento (São Paulo)'}: {aplicados.inicio ? data(aplicados.inicio) : 'sem início'} a {aplicados.fim ? data(aplicados.fim) : 'sem fim'}</span>
        <span>{aplicados.ponto_coleta_id ? pontos.find(p => String(p.id) === aplicados.ponto_coleta_id)?.nome || 'Ponto selecionado' : 'Todos os pontos'}</span>
        <span>{aplicados.residuo_principal || 'Todos os resíduos'}</span><span>{aplicados.situacao || 'Todas as situações'}</span>
      </div>
      <div className="relatorio-totais">
        {([['Registros',dados.totais.registros],['Pendentes',dados.totais.pendentes],['Recebidos',dados.totais.recebidos],['Declarado (kg)',kg(dados.totais.peso_declarado_kg)],['Recebido (kg)',kg(dados.totais.peso_recebido_kg)]]).map(([label,value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </div>
      <div className="relatorio-exportacao"><button type="button" disabled={carregando || exportando || alterados} onClick={() => void exportar()}>{exportando ? 'Exportando...' : 'Exportar CSV dos filtros aplicados'}</button>
      <p className="painel-ajuda">O CSV abre no Excel e inclui todos os resultados dos filtros aplicados. Para incluir novos atendimentos, aplique os filtros novamente.</p></div>
      <p className="painel-ajuda">Registros representam pedidos, não pessoas únicas. Pesos declarados e aferidos são separados; corrigir o peso não cria outro atendimento.</p>
      <div className="relatorio-agrupamentos">
      <Agrupamento titulo="Por ponto de coleta" grupos={dados.por_ponto} />
      <Agrupamento titulo="Por tipo de resíduo" grupos={dados.por_residuo} />
      </div>
      <h3>Registros filtrados ({dados.registros.length})</h3>
      <p className="painel-rolagem">Deslize a tabela para ver todas as informações.</p><div className="relatorio-tabela" tabIndex={0} role="region" aria-label="Registros filtrados"><table><thead><tr><th>Protocolo</th><th>Registro (São Paulo)</th><th>Ponto</th><th>Resíduo</th><th>Situação</th><th>Declarado (kg)</th><th>Recebido (kg)</th><th>Recebimento (São Paulo)</th></tr></thead>
        <tbody>{dados.registros.slice(0,limite).map(r => <tr key={r.id}><td>{r.protocolo}</td><td>{data(r.criado_em)}</td><td>{r.ponto_nome || 'Sem ponto'}</td><td>{r.residuo_principal || 'Não informado'}</td><td><span className={'painel-status ' + (r.situacao === 'PENDENTE' ? 'painel-status--pendente' : r.situacao === 'RECEBIDO' ? 'painel-status--recebido' : '')}>{r.situacao}</span></td><td>{kg(r.quantidade_kg)}</td><td>{kg(r.peso_recebido_kg)}</td><td>{data(r.recebido_em || '')}</td></tr>)}</tbody></table></div>
      {!dados.registros.length && <p>Nenhum registro encontrado para os filtros.</p>}
      {dados.registros.length > limite && <button type="button" onClick={() => setLimite(l => l + 100)}>Mostrar mais registros ({limite} de {dados.registros.length})</button>}
    </div>}
  </div>;
}
