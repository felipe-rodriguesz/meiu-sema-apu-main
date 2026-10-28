import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('noticias')
export class Noticia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ nullable: true })
  resumo: string;

  @Column({ nullable: true })
  categoria: string;

  @Column({ type: 'date', nullable: true })
  data_publicacao: string;

  @CreateDateColumn({ type: 'timestamp' })
  criado_em: Date;
}
