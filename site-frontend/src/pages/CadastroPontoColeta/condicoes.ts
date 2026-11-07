export interface HorarioDia { dia: number; inicio: string; fim: string }
export interface Condicoes {
  horarios_semana: HorarioDia[];
  materiais_lista: string[];
  limite_kg_por_pedido: string;
  orientacoes: string;
}
export const condicoesVazias: Condicoes = { horarios_semana: [], materiais_lista: [], limite_kg_por_pedido: '', orientacoes: '' };
export const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
// Mesmas categorias principais utilizadas no questionário do gerador.
export const materiaisPrincipais = [
  'Retalho de corte', 'Apara de tecido', 'Sobra de enfesto', 'Sobra de rolo',
  'Fio residual', 'Linha quebrada / sobra de cone', 'Pó têxtil / fiapo',
  'Tecido reprovado', 'Sobra de entretela / manta',
];
export function duracao(inicio: string, fim: string): string {
  if (!inicio || !fim || inicio >= fim) return '';
  const minutos = (hora: string) => Number(hora.slice(0,2)) * 60 + Number(hora.slice(3));
  const total = minutos(fim) - minutos(inicio);
  return [Math.floor(total / 60) ? Math.floor(total / 60) + 'h' : '', total % 60 ? total % 60 + 'min' : ''].filter(Boolean).join(' ');
}
