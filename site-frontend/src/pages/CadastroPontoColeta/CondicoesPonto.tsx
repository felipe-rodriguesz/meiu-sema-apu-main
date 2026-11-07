import { useState } from 'react';
import { dias, duracao, materiaisPrincipais } from './condicoes';
import type { Condicoes } from './condicoes';
import './CondicoesPonto.css';

export function CondicoesPonto({ value, onChange }: { value: Condicoes; onChange: (v: Condicoes) => void }) {
  const [padrao, setPadrao] = useState(() => {
    const validos = value.horarios_semana.filter(h => duracao(h.inicio, h.fim));
    const frequencia = (h: typeof validos[number]) => validos.filter(v => v.inicio === h.inicio && v.fim === h.fim).length;
    const comum = [...validos].sort((a, b) => frequencia(b) - frequencia(a))[0];
    return { inicio: comum?.inicio || '', fim: comum?.fim || '' };
  });
  const [personalizados, setPersonalizados] = useState<number[]>(() => value.horarios_semana
    .filter(h => !duracao(h.inicio, h.fim) || h.inicio !== padrao.inicio || h.fim !== padrao.fim).map(h => h.dia));
  function alterarPadrao(campo: 'inicio' | 'fim', hora: string) {
    const novo = { ...padrao, [campo]: hora };
    setPadrao(novo);
    onChange({ ...value, horarios_semana: value.horarios_semana.map(h => personalizados.includes(h.dia) ? h : { dia: h.dia, ...novo }) });
  }
  function usarPadrao(dia: number) {
    setPersonalizados(atual => atual.filter(d => d !== dia));
    onChange({ ...value, horarios_semana: value.horarios_semana.map(h => h.dia === dia ? { dia, ...padrao } : h) });
  }
  const padraoValido = !!duracao(padrao.inicio, padrao.fim);
  const [outroAberto, setOutroAberto] = useState(false);
  const [novoMaterial, setNovoMaterial] = useState('');
  const [erroMaterial, setErroMaterial] = useState('');
  const extras = value.materiais_lista.filter(m => !materiaisPrincipais.includes(m));
  function selecionarDia(dia: number, ativo: boolean) {
    setPersonalizados(atual => atual.filter(d => d !== dia));
    onChange({ ...value, horarios_semana: ativo
      ? [...value.horarios_semana, { dia, ...padrao }].sort((a,b) => a.dia - b.dia)
      : value.horarios_semana.filter(h => h.dia !== dia) });
  }
  function horario(dia: number, campo: 'inicio' | 'fim', hora: string) {
    onChange({ ...value, horarios_semana: value.horarios_semana.map(h => h.dia === dia ? { ...h, [campo]: hora } : h) });
  }
  function material(nome: string, ativo: boolean) {
    onChange({ ...value, materiais_lista: ativo ? [...value.materiais_lista, nome] : value.materiais_lista.filter(m => m !== nome) });
  }
  function adicionarMaterial() {
    const nome = novoMaterial.trim();
    if (!nome) { setErroMaterial('Digite o nome do material.'); return; }
    if (value.materiais_lista.some(m => m.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'))) {
      setErroMaterial('Esse material já está selecionado.'); return;
    }
    if (value.materiais_lista.length >= 50) { setErroMaterial('O ponto já possui 50 materiais.'); return; }
    const principal = materiaisPrincipais.find(m => m.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'));
    material(principal || nome, true); setNovoMaterial(''); setErroMaterial('');
  }
  return <section className="condicoes-ponto" aria-labelledby="condicoes-titulo">
    <header className="condicoes-cabecalho"><div>
      <h2 id="condicoes-titulo">Condições de atendimento</h2>
      <p>Defina quando o ponto atende e quais materiais pode receber.</p>
    </div></header>
    <div className="condicoes-colunas">
      <fieldset className="condicoes-secao">
        <legend>Dias e horários</legend>
        <p className="condicoes-ajuda">Defina o horário padrão e marque os dias. Personalize apenas os dias com atendimento diferente.</p>
        <div className="agenda-padrao">
          <h3>Horário padrão</h3>
          <div className="agenda-horarios">
            <label htmlFor="padrao-inicio">Das<input id="padrao-inicio" aria-label="Início do horário padrão" type="time" value={padrao.inicio} onChange={e => alterarPadrao('inicio', e.target.value)} /></label>
            <label htmlFor="padrao-fim">Até<input id="padrao-fim" aria-label="Fim do horário padrão" type="time" value={padrao.fim} onChange={e => alterarPadrao('fim', e.target.value)} /></label>
            <span className="agenda-duracao" role="status">{padraoValido ? duracao(padrao.inicio, padrao.fim) + ' de atendimento por dia' : 'Informe um horário válido para selecionar os dias.'}</span>
            {padrao.inicio && padrao.fim && !padraoValido && <span className="condicoes-erro">O fim deve ser depois do início, no mesmo dia.</span>}
          </div>
          <p>Alterações no padrão se aplicam aos dias selecionados, preservando os horários personalizados.</p>
        </div>
        <h3 className="agenda-subtitulo">Dias de atendimento</h3>
        <div className="agenda-semana">
          {[1,2,3,4,5,6,0].map(dia => {
            const h = value.horarios_semana.find(item => item.dia === dia);
            const personalizado = personalizados.includes(dia);
            const tempo = h ? duracao(h.inicio, h.fim) : '';
            const invalido = h?.inicio && h?.fim && h.inicio >= h.fim;
            return <div key={dia} className={'agenda-dia' + (h ? ' agenda-dia--ativo' : '')}>
              <div className="agenda-linha">
                <label className="agenda-selecao">
                  <input type="checkbox" aria-label={dias[dia]} checked={!!h} disabled={!h && !padraoValido} onChange={e => selecionarDia(dia, e.target.checked)} />
                  <span>{dias[dia]}<small>{h ? (tempo ? h.inicio + ' – ' + h.fim : 'Horário incompleto') : 'Sem atendimento'}</small></span>
                </label>
                {h && <button type="button" className="agenda-personalizar" aria-label={(personalizado ? 'Usar horário padrão em ' : 'Personalizar ') + dias[dia]}
                  disabled={personalizado && !padraoValido} aria-expanded={personalizado} aria-controls={'horarios-dia-' + dia}
                  onClick={() => personalizado ? usarPadrao(dia) : setPersonalizados(atual => [...atual, dia])}>{personalizado ? 'Usar padrão' : 'Personalizar'}</button>}
              </div>
              {h && personalizado && <div className="agenda-horarios" id={'horarios-dia-' + dia}>
                <label htmlFor={'inicio-dia-' + dia}>Das<input id={'inicio-dia-' + dia} aria-label={'Início de ' + dias[dia]} type="time" value={h.inicio} required onChange={e => horario(dia,'inicio',e.target.value)} /></label>
                <label htmlFor={'fim-dia-' + dia}>Até<input id={'fim-dia-' + dia} aria-label={'Fim de ' + dias[dia]} type="time" value={h.fim} required onChange={e => horario(dia,'fim',e.target.value)} /></label>
                <span className="agenda-duracao">{tempo ? tempo + ' de atendimento · horário personalizado' : 'Defina o horário'}</span>
                {invalido && <span className="condicoes-erro">O fim deve ser depois do início, no mesmo dia.</span>}
              </div>}
            </div>;
          })}
        </div>
      </fieldset>
      <div className="condicoes-detalhes">
        <fieldset className="condicoes-secao">
          <legend>Materiais aceitos</legend>
          <p className="condicoes-ajuda">Marque os tipos de resíduos têxteis recebidos neste ponto.</p>
          <div className="materiais-opcoes">
            {materiaisPrincipais.map(nome => <label key={nome} className={'material-opcao' + (value.materiais_lista.includes(nome) ? ' material-opcao--ativo' : '')}>
              <input type="checkbox" checked={value.materiais_lista.includes(nome)} onChange={e => material(nome,e.target.checked)} /><span>{nome}</span>
            </label>)}
          </div>
          <label className="material-outro"><input type="checkbox" checked={outroAberto || extras.length > 0} onChange={e => { setOutroAberto(e.target.checked); setErroMaterial(''); if (!e.target.checked) { setNovoMaterial(''); onChange({ ...value, materiais_lista: value.materiais_lista.filter(m => materiaisPrincipais.includes(m)) }); } }} aria-controls="adicionar-outro-material" />Outro</label>
          {(outroAberto || extras.length > 0) && <div id="adicionar-outro-material" className="material-personalizado">
            <label htmlFor="novo-material">Nome do material</label>
            <div className="material-adicionar"><input id="novo-material" type="text" maxLength={120} value={novoMaterial} placeholder="Ex.: peças de algodão usadas" onChange={e => { setNovoMaterial(e.target.value); setErroMaterial(''); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionarMaterial(); } }} />
              <button type="button" onClick={adicionarMaterial}>Adicionar</button></div>
            {erroMaterial && <p className="condicoes-erro" role="alert">{erroMaterial}</p>}
            {!!extras.length && <ul className="materiais-adicionados">{extras.map(nome => <li key={nome}><span>{nome}</span><button type="button" aria-label={'Remover material ' + nome} onClick={() => material(nome,false)}>×</button></li>)}</ul>}
            <small>Os materiais adicionados ficam disponíveis apenas neste ponto.</small>
          </div>}
        </fieldset>
        <fieldset className="condicoes-secao condicoes-complementos"><legend>Orientações e limite</legend>
          <label htmlFor="limite-pedido">Limite por pedido (kg)<input id="limite-pedido" type="text" inputMode="decimal" value={value.limite_kg_por_pedido} onChange={e => onChange({ ...value, limite_kg_por_pedido: e.target.value })} placeholder="Sem limite configurado" /></label>
          <label htmlFor="orientacoes-entrega">Orientações para entrega<textarea id="orientacoes-entrega" maxLength={2000} value={value.orientacoes} onChange={e => onChange({ ...value, orientacoes: e.target.value })} placeholder="Como chegar, preparar o material e apresentar o protocolo" /></label>
        </fieldset>
      </div>
    </div>
  </section>;
}
