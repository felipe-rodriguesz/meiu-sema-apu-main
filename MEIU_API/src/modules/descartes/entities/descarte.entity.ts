import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { randomUUID } from 'node:crypto';

import { PontoColeta } from '../../pontos-coleta/entities/ponto-coleta.entity';

@Entity('descarte')
export class Descarte {
  @PrimaryColumn('uuid')
  id: string = randomUUID();

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  criado_em: Date = new Date();

  @Column({ unique: true })
  protocolo: string;

  @Column({ default: 'PENDENTE' })
  situacao: string;

  @Column({ type: 'boolean', nullable: true })
  eh_mistura: boolean;

  @Column({ nullable: true })
  residuo_principal: string;

  @Column({ type: 'numeric', precision: 12, scale: 3, nullable: true, transformer: { to: value => value, from: value => value == null ? null : Number(value) } })
  quantidade_kg: number;

  @Column({ type: 'numeric', precision: 12, scale: 3, nullable: true, transformer: { to: value => value, from: value => value == null ? null : Number(value) } })
  peso_recebido_kg: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  recebido_em: Date | null;

  @Column({ type: 'uuid', nullable: true })
  recebido_por: string | null;

  @Column({ type: 'integer', default: 0 })
  recebimento_versao: number;

  @Column({ type: 'integer', nullable: true })
  frequencia_dias: number;

  @Column({ nullable: true })
  material: string;

  @Column({ nullable: true })
  estado_material: string;

  @Column({ nullable: true })
  tipo_tecido: string;

  @Column({ type: 'numeric', nullable: true })
  lat: number;

  @Column({ type: 'numeric', nullable: true })
  lon: number;

  @Column({ type: 'uuid', nullable: true })
  ponto_coleta_id: string;

  @ManyToOne(() => PontoColeta, { nullable: true })
  @JoinColumn({ name: 'ponto_coleta_id' })
  ponto_coleta?: PontoColeta;
}
