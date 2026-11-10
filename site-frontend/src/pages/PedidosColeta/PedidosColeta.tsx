import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import api from '../../services/api';
import styles from './PedidosColeta.module.css';

interface Ponto { id: string; nome: string; bairro?: string; endereco?: string; status?: string }
interface Evento {
  id: string; versao: number; tipo: string; peso_anterior_kg: number | null; peso_novo_kg: number;
  motivo: string | null; criado_em: string; operador: { id: string; nome: string };
}
interface Pedido {
  id: string; protocolo: string; criado_em: string; situacao: string; quantidade_kg: number;
  peso_recebido_kg: number | null; recebido_em: string | null; recebimento_versao: number;
  residuo_principal: string; material: string; estado_material: string; tipo_tecido: string;
  frequencia_dias: number; eh_mistura: boolean; ponto_coleta?: Ponto; historico?: Evento[];
}
const kg = (value: number | null) => value == null ? '—' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(value) + ' kg';
const date = (value?: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
function message(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return 'Sua sessão expirou. Entre novamente.';
    const value = error.response?.data?.message;
    if (value) return Array.isArray(value) ? value.join(' ') : String(value);
  }
  return 'Não foi possível concluir a operação. Confira a conexão e consulte o pedido antes de tentar novamente.';
}

export default function PedidosColeta(): React.JSX.Element {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('TODOS');
  const [protocolo, setProtocolo] = useState(() => new URLSearchParams(location.search).get('protocolo') || '');
  const [selecionado, setSelecionado] = useState<Pedido | null>(null);
  const [peso, setPeso] = useState('');
  const [motivo, setMotivo] = useState('');
  const [corrigindo, setCorrigindo] = useState(false);
  const [conferido, setConferido] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [buscando, setBuscando] = useState(() => Boolean(new URLSearchParams(location.search).get('protocolo')?.trim()));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [erroPedido, setErroPedido] = useState('');
  const [sucesso, setSucesso] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const saving = useRef(false);
  const detailSequence = useRef(0);

  const consultarLista = useCallback(() => {
    return api.get<Pedido[]>('/descartes')
      .then(response => { setPedidos(response.data); })
      .catch(error => { setErro(message(error)); })
      .finally(() => { setCarregando(false); });
  }, []);

  const carregar = () => {
    setCarregando(true); setErro('');
    return consultarLista();
  };

  const consultarPedido = useCallback((codigo: string) => {
    if (!codigo.trim()) return;
    const sequence = ++detailSequence.current;
    return api.get<Pedido>('/descartes/protocolo/' + encodeURIComponent(codigo.trim())).then(({ data: pedido }) => {
      if (sequence !== detailSequence.current) return;
      setSelecionado(pedido); setPeso(''); setMotivo(''); setCorrigindo(false); setConferido(false);
      const url = new URL(location.href);
      url.searchParams.set('protocolo', pedido.protocolo);
      history.replaceState(null, '', url);
    }).catch(error => {
      if (sequence === detailSequence.current) setErro(message(error));
    }).finally(() => {
      if (sequence === detailSequence.current) setBuscando(false);
    });
  }, []);

  const abrir = (codigo: string) => {
    if (!codigo.trim()) return;
    setBuscando(true); setErro(''); setErroPedido(''); setSucesso('');
    return consultarPedido(codigo);
  };

  useEffect(() => {
    void consultarLista();
    const initial = new URLSearchParams(location.search).get('protocolo');
    if (initial) void consultarPedido(initial);
  }, [consultarLista, consultarPedido]);

  useEffect(() => {
    if (selecionado && !dialog.current?.open) dialog.current?.showModal();
  }, [selecionado]);

  function fechar() {
    if (saving.current) return;
    dialog.current?.close(); setSelecionado(null);
    const url = new URL(location.href); url.searchParams.delete('protocolo');
    history.replaceState(null, '', url);
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    if (!selecionado || saving.current) return;
    if (!/^\d{1,9}([,.]\d{1,3})?$/.test(peso.trim()) || Number(peso.replace(',', '.')) <= 0) {
      setErroPedido('Informe um peso positivo, sem separador de milhar, com até três casas decimais.'); return;
    }
    if (!conferido) { setErroPedido('Confirme que conferiu o material e a pesagem.'); return; }
    saving.current = true; setSalvando(true); setErroPedido(''); setSucesso('');
    try {
      const endpoint = '/descartes/' + selecionado.id + '/recebimento';
      const payload = { peso_recebido_kg: Number(peso.replace(',', '.')) };
      const response = corrigindo
        ? await api.patch<Pedido>(endpoint, { ...payload, motivo: motivo.trim(), versao: selecionado.recebimento_versao })
        : await api.post<Pedido>(endpoint, payload);
      setSelecionado(response.data);
      setPedidos(current => current.map(pedido => pedido.id === response.data.id ? response.data : pedido));
      setSucesso(corrigindo ? 'Correção registrada no histórico.' : 'Recebimento confirmado.');
      setCorrigindo(false); setPeso(''); setMotivo(''); setConferido(false);
    } catch (error) { setErroPedido(message(error)); }
    finally { saving.current = false; setSalvando(false); }
  }

  const filtrados = useMemo(() => pedidos.filter(pedido => {
    const texto = [pedido.protocolo, pedido.residuo_principal, pedido.material, pedido.ponto_coleta?.nome, pedido.ponto_coleta?.bairro].join(' ').toLowerCase();
    return (filtro === 'TODOS' || pedido.situacao === filtro) && texto.includes(busca.trim().toLowerCase());
  }), [pedidos, busca, filtro]);
  const declarados = filtrados.reduce((total, p) => total + Math.round(Number(p.quantidade_kg || 0) * 1000), 0) / 1000;
  const recebidos = filtrados.reduce((total, p) => total + (p.situacao === 'RECEBIDO' ? Math.round(Number(p.peso_recebido_kg || 0) * 1000) : 0), 0) / 1000;
  const situacoes = [...new Set(['PENDENTE', 'RECEBIDO', ...pedidos.map(p => p.situacao)])].filter(Boolean);
  const formulario = selecionado && (selecionado.situacao === 'PENDENTE' || corrigindo);

  return <div className={styles.container}>
    <section className={styles.header}>
      <div><h2 className={styles.title}>Pedidos e recebimentos</h2>
        <p className={styles.description}>Localize o protocolo, confira o material e registre o peso aferido no ponto de coleta.</p></div>
      <button className={styles.refreshButton} onClick={() => { setErro(''); void carregar(); }} disabled={carregando}>
        {carregando ? 'Atualizando...' : 'Atualizar lista'}
      </button>
    </section>
    <form className={styles.filters + " " + styles.protocolSearch} onSubmit={e => { e.preventDefault(); void abrir(protocolo); }}>
      <label className={styles.protocolField}>Localizar protocolo
        <input className={styles.input} value={protocolo} onChange={e => setProtocolo(e.target.value)}
          placeholder="TX-..." required maxLength={100} autoComplete="off" />
      </label>
      <button className={styles.refreshButton} disabled={buscando}>{buscando ? 'Buscando...' : 'Abrir pedido'}</button>
    </form>
    {erro && <div className={styles.error} role="alert">{erro}</div>}
    <section className={styles.cards} aria-label="Resumo dos pedidos filtrados">
      <div className={styles.card}><span className={styles.cardLabel}>Pedidos exibidos</span><strong className={styles.cardValue}>{filtrados.length}</strong></div>
      <div className={styles.card}><span className={styles.cardLabel}>Peso declarado</span><strong className={styles.cardValue}>{kg(declarados)}</strong></div>
      <div className={styles.card}><span className={styles.cardLabel}>Peso recebido</span><strong className={styles.cardValue}>{kg(recebidos)}</strong></div>
    </section>
    <section className={styles.filters}>
      <label className={styles.filterField}>Buscar na lista<input aria-label="Filtrar pedidos" className={styles.input} value={busca} onChange={e => setBusca(e.target.value)} placeholder="Protocolo, material, ponto ou bairro" /></label>
      <label className={styles.filterField}>Situação<select aria-label="Situação" className={styles.select} value={filtro} onChange={e => setFiltro(e.target.value)}>
        <option value="TODOS">Todas as situações</option>
        {situacoes.map(s => <option key={s} value={s}>{s}</option>)}
      </select></label>
      {(busca || filtro !== 'TODOS') && <button type="button" className="painel-secundario" onClick={() => { setBusca(''); setFiltro('TODOS'); }}>Limpar filtros</button>}
    </section>
    <section className={styles.tableContainer}>
      <h3 className="painel-subtitulo">Lista de pedidos</h3>
      <p className="painel-ajuda" role="status">{carregando ? 'Atualizando pedidos...' : filtrados.length + ' de ' + pedidos.length + ' pedidos'} · Os totais acima acompanham os filtros desta lista.</p>
      <p className="painel-rolagem">Deslize a tabela para ver todas as informações e ações.</p>
      <div className={styles.tableWrapper} tabIndex={0} role="region" aria-label="Lista de pedidos">
      <table className={styles.table}>
        <thead><tr className={styles.tableHeadRow}>{['Protocolo / registro', 'Resíduo', 'Ponto de coleta', 'Declarado', 'Recebido', 'Situação', 'Ações'].map(label => <th className={styles.th} key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>
          {!filtrados.length && <tr><td className={styles.emptyRow} colSpan={7}>{carregando ? 'Carregando...' : 'Nenhum pedido encontrado.'}</td></tr>}
          {filtrados.map(p => <tr className={styles.tableRow} key={p.id}>
            <td className={styles.td}><strong>{p.protocolo}</strong><span className={styles.smallText}>{date(p.criado_em)}</span></td>
            <td className={styles.td}>{p.residuo_principal}<span className={styles.smallText}>{p.material}</span></td>
            <td className={styles.td}>{p.ponto_coleta?.nome || 'Não informado'}</td>
            <td className={styles.td}>{kg(p.quantidade_kg)}</td>
            <td className={styles.td}>{kg(p.peso_recebido_kg)}</td>
            <td className={styles.td}><span className={styles.statusBadge + ' ' + (p.situacao === 'PENDENTE' ? styles.pendingBadge : p.situacao === 'RECEBIDO' ? styles.receivedBadge : styles.neutralBadge)}>{p.situacao}</span></td>
            <td className={styles.td}><button disabled={buscando} className={styles.detailsButton} onClick={() => void abrir(p.protocolo)}>Ver pedido</button></td>
          </tr>)}
        </tbody>
      </table>
    </div></section>
    <dialog ref={dialog} className={styles.receiptDialog} aria-labelledby="pedido-title" onCancel={event => { event.preventDefault(); fechar(); }}>
      {selecionado && <>
        <div className={styles.modalHeader}>
          <div><h3 id="pedido-title" className={styles.modalTitle}>{selecionado.protocolo}</h3><p className={styles.modalSubtitle}>{selecionado.situacao} · Registro em {date(selecionado.criado_em)}</p></div>
          <button className={styles.closeButton} aria-label="Fechar pedido" onClick={fechar} disabled={salvando}>×</button>
        </div>
        <div className={styles.detailsGrid}>
          <div><span className={styles.detailLabel}>Peso declarado</span><strong>{kg(selecionado.quantidade_kg)}</strong></div>
          <div><span className={styles.detailLabel}>Peso recebido</span><strong>{kg(selecionado.peso_recebido_kg)}</strong></div>
          <div><span className={styles.detailLabel}>Resíduo / composição</span><strong>{selecionado.residuo_principal} · {selecionado.material}</strong></div>
          <div><span className={styles.detailLabel}>Condição / tipo de tecido</span><strong>{selecionado.estado_material} · {selecionado.tipo_tecido}</strong></div>
          <div><span className={styles.detailLabel}>Frequência / mistura</span><strong>A cada {selecionado.frequencia_dias} dias · {selecionado.eh_mistura ? 'Mistura' : 'Material único'}</strong></div>
          <div><span className={styles.detailLabel}>Recebimento</span><strong>{date(selecionado.recebido_em)}</strong><span className={styles.smallText}>{selecionado.historico?.[0]?.operador.nome}</span></div>
        </div>
        <div className={styles.pointBox}><h4>Ponto de coleta</h4><p><strong>{selecionado.ponto_coleta?.nome || 'Não informado'}</strong></p><p>{selecionado.ponto_coleta?.endereco}</p><p>{selecionado.ponto_coleta?.bairro} · {selecionado.ponto_coleta?.status}</p></div>
        {sucesso && <p className={styles.success} role="status">{sucesso}</p>}
        {erroPedido && <div className={styles.error} role="alert">{erroPedido}<button className={styles.reloadButton} disabled={salvando} onClick={() => void abrir(selecionado.protocolo)}>Consultar valores atuais</button></div>}
        {formulario && <form onSubmit={salvar} className={styles.receiptForm}>
          <h4>{corrigindo ? 'Corrigir peso recebido' : 'Confirmar recebimento'}</h4>
          <label>Peso aferido (kg)
            <input autoComplete="off" className={styles.input} inputMode="decimal" value={peso} onChange={e => setPeso(e.target.value)} placeholder="Ex.: 8,7" required disabled={salvando} maxLength={13} />
          </label>
          {corrigindo && <label>Motivo da correção
            <textarea className={styles.input} value={motivo} onChange={e => setMotivo(e.target.value)} required minLength={5} maxLength={500} disabled={salvando} />
          </label>}
          <label className={styles.checkLabel}><input type="checkbox" checked={conferido} onChange={e => setConferido(e.target.checked)} required disabled={salvando} />Conferi o material e a pesagem.</label>
          <p className={styles.description}>O peso declarado será preservado. Esta confirmação registra o recebimento, não a destinação posterior.</p>
          <div className={styles.formActions}><button className={styles.refreshButton} disabled={salvando}>{salvando ? 'Salvando...' : corrigindo ? 'Salvar correção' : 'Confirmar recebimento'}</button>
            {corrigindo && <button type="button" className={styles.reloadButton} disabled={salvando} onClick={() => { setCorrigindo(false); setErroPedido(''); }}>Cancelar correção</button>}
          </div>
        </form>}
        {selecionado.situacao === 'RECEBIDO' && !corrigindo && <button className={styles.reloadButton} onClick={() => { setCorrigindo(true); setPeso(String(selecionado.peso_recebido_kg).replace('.', ',')); setSucesso(''); }}>Corrigir peso com justificativa</button>}
        {!!selecionado.historico?.length && <section className={styles.history}><h4>Histórico do recebimento</h4><ol>
          {selecionado.historico.map(h => <li key={h.id}><strong>{h.tipo === 'RECEBIMENTO' ? 'Recebimento' : 'Correção'} · {kg(h.peso_novo_kg)}</strong>
            <span className={styles.smallText}>{date(h.criado_em)} · {h.operador.nome}</span>
            {h.peso_anterior_kg != null && <p>Anterior: {kg(h.peso_anterior_kg)}. Motivo: {h.motivo}</p>}</li>)}
        </ol></section>}
      </>}
    </dialog>
  </div>;
}
