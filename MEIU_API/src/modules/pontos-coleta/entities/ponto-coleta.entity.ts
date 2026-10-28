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

  @CreateDateColumn({ type: 'timestamp' })
  criado_em: Date;
}