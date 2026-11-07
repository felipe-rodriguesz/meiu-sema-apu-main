import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('ponto_coleta')
export class PontoColeta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column()
  tipo: string; // Ex: 'Ponto Fixo', 'Rota Semanal'

  @Column({ nullable: true })
  bairro: string;

  @Column({ nullable: true })
  endereco: string;

  @Column({ type: 'numeric', nullable: true })
  lat: number;

  @Column({ type: 'numeric', nullable: true })
  lon: number;

  @Column({ default: 'ATIVO' })
  status: string;

  @Column({ type: 'integer', array: true, default: '{}' })
  dias_semana: number[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  horarios_semana: { dia: number; inicio: string | null; fim: string | null }[];

  @Column({ type: 'text', array: true, default: '{}' })
  materiais_lista: string[];

  @Column({ type: 'date', nullable: true })
  data_inicio: string | null;

  @Column({ type: 'date', nullable: true })
  data_fim: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  horario_inicio: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  horario_fim: string | null;

  @Column({ type: 'text', nullable: true })
  materiais_aceitos: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 3, nullable: true, transformer: { to: v => v, from: v => v == null ? null : Number(v) } })
  limite_kg_por_pedido: number | null;

  @Column({ type: 'text', nullable: true })
  orientacoes: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  criado_em: Date;
}
