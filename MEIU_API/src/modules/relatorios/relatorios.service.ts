import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FiltroRelatorioDto } from './filtro-relatorio.dto';

export interface RegistroRelatorio {
  id: string; protocolo: string; criado_em: string; situacao: string;
  ponto_coleta_id: string | null; ponto_nome: string | null; residuo_principal: string | null;
  quantidade_kg: number | null; peso_recebido_kg: number | null; frequencia_dias: number | null;
  eh_mistura: boolean | null; material: string | null; estado_material: string | null;
  tipo_tecido: string | null; recebido_em: string | null;
}
type RegistroBanco = Omit<RegistroRelatorio, 'quantidade_kg' | 'peso_recebido_kg'> & {
  quantidade_kg: string | number | null; peso_recebido_kg: string | number | null;
};
type Grupo = ReturnType<typeof vazio> & { chave: string; nome: string };

const vazio = () => ({ registros: 0, pendentes: 0, recebidos: 0, peso_declarado_kg: 0, peso_recebido_kg: 0 });
const somar = (total: ReturnType<typeof vazio>, row: RegistroRelatorio) => {
  total.registros++;
  if (row.situacao === 'PENDENTE') total.pendentes++;
  if (row.situacao === 'RECEBIDO') total.recebidos++;
  // Acumular em gramas evita perda de precisão na soma de pesos decimais.
  total.peso_declarado_kg += Math.round(Number(row.quantidade_kg || 0) * 1000);
  total.peso_recebido_kg += Math.round(Number(row.peso_recebido_kg || 0) * 1000);
};
const finalizar = <T extends ReturnType<typeof vazio>>(total: T) => ({
  ...total, peso_declarado_kg: total.peso_declarado_kg / 1000, peso_recebido_kg: total.peso_recebido_kg / 1000,
});

@Injectable()
export class RelatoriosService {
  constructor(private readonly dataSource: DataSource) {}

  async consultar(f: FiltroRelatorioDto) {
    if (f.inicio && f.fim && f.inicio > f.fim) throw new BadRequestException('O início deve ser anterior ou igual ao fim.');
    const params: unknown[] = [];
    const clauses: string[] = [];
    const bind = (v: unknown) => { params.push(v); return '$' + params.length; };
    // Datas legadas de criação não têm fuso. Comparar o calendário gravado,
    // sem reinterpretá-lo; recebimentos têm fuso e usam o calendário de São Paulo.
    const data = f.base_data === 'recebimento'
      ? "(d.recebido_em AT TIME ZONE 'America/Sao_Paulo')::date"
      : 'd.criado_em::date';
    if (f.base_data === 'recebimento') clauses.push('d.recebido_em IS NOT NULL');
    if (f.inicio) clauses.push(data + ' >= ' + bind(f.inicio) + '::date');
    if (f.fim) clauses.push(data + ' <= ' + bind(f.fim) + '::date');
    if (f.ponto_coleta_id) clauses.push('d.ponto_coleta_id = ' + bind(f.ponto_coleta_id));
    if (f.residuo_principal) clauses.push('d.residuo_principal = ' + bind(f.residuo_principal));
    if (f.situacao) clauses.push('d.situacao = ' + bind(f.situacao));
    const rows = await this.dataSource.query<RegistroBanco[]>(`
      SELECT d.id, d.protocolo, to_char(d.criado_em, 'YYYY-MM-DD HH24:MI:SS') AS criado_em,
        d.situacao, d.ponto_coleta_id, p.nome AS ponto_nome, d.residuo_principal,
        d.quantidade_kg, d.peso_recebido_kg, d.frequencia_dias,
        d.eh_mistura, d.material, d.estado_material, d.tipo_tecido,
        CASE WHEN d.recebido_em IS NULL THEN NULL ELSE to_char(d.recebido_em AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI:SS') END AS recebido_em
      FROM descarte d LEFT JOIN ponto_coleta p ON p.id = d.ponto_coleta_id
      ${clauses.length ? 'WHERE ' + clauses.join(' AND ') : ''}
      ORDER BY d.criado_em DESC, d.id`, params);
    const registros: RegistroRelatorio[] = rows.map(row => ({
      ...row,
      quantidade_kg: row.quantidade_kg == null ? null : Number(row.quantidade_kg),
      peso_recebido_kg: row.peso_recebido_kg == null ? null : Number(row.peso_recebido_kg),
    }));
    const total = vazio();
    const porPonto = new Map<string, Grupo>();
    const porResiduo = new Map<string, Grupo>();
    for (const row of registros) {
      somar(total, row);
      const p = row.ponto_coleta_id || '';
      if (!porPonto.has(p)) porPonto.set(p, { chave: p, nome: row.ponto_nome || 'Sem ponto', ...vazio() });
      somar(porPonto.get(p), row);
      const r = row.residuo_principal || 'Não informado';
      if (!porResiduo.has(r)) porResiduo.set(r, { chave: r, nome: r, ...vazio() });
      somar(porResiduo.get(r), row);
    }
    return {
      filtros: { ...f, base_data: f.base_data || 'registro' },
      totais: finalizar(total),
      por_ponto: [...porPonto.values()].map(finalizar),
      por_residuo: [...porResiduo.values()].map(finalizar),
      registros,
    };
  }

  async csv(f: FiltroRelatorioDto) {
    const relatorio = await this.consultar(f);
    const text = (v: unknown) => {
      let s = v == null ? '' : String(v);
      // Evitar interpretação como fórmula em planilhas, inclusive após espaços.
      if (/^[\s]*[=+\-@]/.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const peso = (v: number | null) => v == null ? '' : v.toFixed(3).replace('.', ',');
    const header = ['Protocolo', 'Registro (calendário gravado)', 'Situação', 'Ponto de coleta', 'Tipo de resíduo', 'Peso declarado (kg)', 'Peso recebido (kg)', 'Recebimento (São Paulo)', 'Frequência (dias)', 'Mistura', 'Composição', 'Estado', 'Tecido/aplicação'];
    const rows = relatorio.registros.map(r => [
      r.protocolo, r.criado_em, r.situacao, r.ponto_nome, r.residuo_principal,
      peso(r.quantidade_kg), peso(r.peso_recebido_kg), r.recebido_em, r.frequencia_dias,
      r.eh_mistura == null ? '' : r.eh_mistura ? 'Sim' : 'Não', r.material, r.estado_material, r.tipo_tecido,
    ]);
    return '\uFEFF' + [header, ...rows].map(row => row.map(text).join(';')).join('\r\n') + '\r\n';
  }
}
