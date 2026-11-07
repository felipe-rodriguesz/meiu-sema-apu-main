import type { PontoColeta } from '../types/questionario.types';
const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
export function CondicoesAtendimento({ ponto }: { ponto: PontoColeta }) {
  const horarios = ponto.horarios_semana ?? (ponto.dias_semana || []).map(dia => ({ dia, inicio: ponto.horario_inicio, fim: ponto.horario_fim }));
  const materiais = ponto.materiais_lista ?? (ponto.materiais_aceitos ? [ponto.materiais_aceitos] : []);
  return <dl className="condicoes-atendimento">
    <div><dt>Dias e horários</dt><dd>{horarios.length ? [...horarios].sort((a,b) => ((a.dia + 6) % 7) - ((b.dia + 6) % 7)).map(h => <div key={h.dia}>{dias[h.dia]}: {h.inicio && h.fim ? h.inicio + ' às ' + h.fim : 'horário não informado'}</div>) : 'Não informados'}</dd></div>
    <div><dt>Materiais aceitos</dt><dd>{materiais.length ? <ul>{materiais.map(m => <li key={m}>{m}</li>)}</ul> : 'Não informados. Confirme com a SEMA antes de levar o material.'}</dd></div>
    <div><dt>Limite por pedido</dt><dd>{ponto.limite_kg_por_pedido == null ? 'Não informado' : Number(ponto.limite_kg_por_pedido).toLocaleString('pt-BR', { maximumFractionDigits: 3 }) + ' kg'}</dd></div>
    {ponto.orientacoes && <div><dt>Orientações</dt><dd>{ponto.orientacoes}</dd></div>}
  </dl>;
}
