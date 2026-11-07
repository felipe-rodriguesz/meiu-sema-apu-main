import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AdminSema } from './entities/admin-sema';

@Injectable()
export class AdminSemaService {
  constructor(
    @InjectRepository(AdminSema)
    private readonly repository: Repository<AdminSema>,
  ) {}

  async findByEmail(email: string): Promise<AdminSema | null> {
    return this.repository.findOne({
      where: { email },
    });
  }

  findById(id: string) { return this.repository.findOneBy({ id }); }
}
