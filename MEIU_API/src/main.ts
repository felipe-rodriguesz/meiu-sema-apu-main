import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './config/configure-app';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { serveWeb } from './config/serve-web';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);
  serveWeb(app, process.env.STATIC_DIR);
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder().setTitle('MEIU API').setVersion('1.1').addCookieAuth('sema_session').build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }
  await app.listen(process.env.PORT || 3001, '0.0.0.0');
}
bootstrap();
