import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { PontoColeta } from '../../pontos-coleta/entities/ponto-coleta.entity';

@Entity('descarte')
export class Descarte {
  @PrimaryColumn('uuid')
  id: string = uuidv4();

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  criado_em: Date = new Date();

  @Column({ unique: true })
  protocolo: string;

  @Column({ default: 'PENDENTE' })
  situacao: string;

  @Column({ type: 'boolean', nullable: true })
  eh_mistura: boolean;

  @Column({ nullable: true })
  residuo_principal: string;

  @Column({ type: 'integer', nullable: true })
  quantidade_kg: number;

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