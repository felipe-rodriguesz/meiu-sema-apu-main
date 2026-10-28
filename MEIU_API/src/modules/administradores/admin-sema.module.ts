import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminSema } from './entities/admin-sema';
import { AdminSemaService } from './admin-sema.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdminSema])],
  providers: [AdminSemaService],
  exports: [AdminSemaService],
})
export class AdminSemaModule {}