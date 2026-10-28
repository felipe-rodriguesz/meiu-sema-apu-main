import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DescartesModule } from './modules/descartes/descartes.module';
import { StatsModule } from './modules/stats/stats.module';
import { AuthModule } from './modules/auth/auth.module';
import { NoticiasModule } from './modules/noticias/noticias.module';
import { PontosColetaModule } from './modules/pontos-coleta/pontos-coleta.module';
import { AdminSemaModule } from './modules/administradores/admin-sema.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        ssl: false,
      }),
    }),

    DescartesModule,
    StatsModule,
    AuthModule,
    NoticiasModule,
    PontosColetaModule,
    AdminSemaModule,
  ],
})
export class AppModule {}