import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Noticia } from './entities/noticia.entity';

@Injectable()
export class NoticiasService {
  constructor(
    @InjectRepository(Noticia)
    private readonly noticiaRepository: Repository<Noticia>,
  ) {}

  async findAll() {
    return this.noticiaRepository.find({
      order: { data_publicacao: 'DESC' },
    });
  }
}
