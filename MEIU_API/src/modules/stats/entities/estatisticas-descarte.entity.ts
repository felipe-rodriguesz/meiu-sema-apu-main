import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('estatisticas_descarte')
export class EstatisticasDescarte {
  @Column({ type: 'bigint', nullable: true, transformer: { to: value => value, from: value => Number(value) } })
  total_registros: number;

  @Column({ type: 'numeric', nullable: true, transformer: { to: value => value, from: value => Number(value) } })
  total_kg: number;

  @Column({ nullable: true })
  residuo_mais_comum: string;

  @PrimaryColumn({ type: 'date' })
  data_atualizacao: string;
}
