import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);
  app.use(helmet());
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableCors({ origin: config.get<string>('CORS_ORIGINS').split(','), methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] });
  app.enableShutdownHooks();
}
