import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './config/configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder().setTitle('MEIU API').setVersion('1.1').addBearerAuth().build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }
  await app.listen(process.env.PORT || 3001, '0.0.0.0');
}
bootstrap();
