import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { requestProtection } from './request-protection';

export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);
  const origins = config.get<string>('CORS_ORIGINS').split(',');
  const production = config.get<string>('NODE_ENV') === 'production';
  const proxyHops = Number(config.get<string>('TRUST_PROXY_HOPS') || 0);
  app.getHttpAdapter().getInstance().set('trust proxy', proxyHops);
  app.use(helmet());
  app.use(requestProtection(origins, production));
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableCors({ origin: origins, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] });
  app.enableShutdownHooks();
}
