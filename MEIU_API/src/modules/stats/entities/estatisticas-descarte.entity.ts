import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('estatisticas_descarte')
export class EstatisticasDescarte {
  @Column({ type: 'bigint', nullable: true })
  total_registros: number;

  @Column({ type: 'bigint', nullable: true })
  total_kg: number;

  @Column({ nullable: true })
  residuo_mais_comum: string;

  @PrimaryColumn({ type: 'date' })
  data_atualizacao: string;
}
