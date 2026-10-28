// src/admin-sema/entities/admin-sema.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn
} from 'typeorm';

@Entity('admin_sema')
export class AdminSema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({
    unique: true
  })
  email: string;

  @Column({
    name: 'senha_hash'
  })
  senhaHash: string;

  @CreateDateColumn({
    name: 'criado_em'
  })
  criadoEm: Date;
}