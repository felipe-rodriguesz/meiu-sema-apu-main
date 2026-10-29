import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DescartesModule } from './modules/descartes/descartes.module';
import { StatsModule } from './modules/stats/stats.module';
import { AuthModule } from './modules/auth/auth.module';
import { NoticiasModule } from './modules/noticias/noticias.module';
import { PontosColetaModule } from './modules/pontos-coleta/pontos-coleta.module';
import { AdminSemaModule } from './modules/administradores/admin-sema.module';
import { databaseOptions, validateEnvironment } from './config/environment';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...databaseOptions({
          DATABASE_URL: configService.get('DATABASE_URL'),
          DATABASE_SSL: configService.get('DATABASE_SSL'),
          DATABASE_CA_FILE: configService.get('DATABASE_CA_FILE'),
          NODE_ENV: configService.get('NODE_ENV'),
        }),
        autoLoadEntities: true,
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
