import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // OWASP: Segurança através de Headers (Helmet)
  app.use(helmet());

  // Prefixo Global para Versionamento
  app.setGlobalPrefix('api/v1');

  // OWASP: Validação estrita de Input para prevenir Injeção e Mass Assignment
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Remove propriedades não definidas no DTO
    forbidNonWhitelisted: true, // Erro se houver propriedades extras
    transform: true,           // Transforma tipos automaticamente
  }));

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('MEIU API')
    .setDescription('API para gestão de resíduos têxteis - Apucarana')
    .setVersion('1.0')
    .addTag('descartes')
    .addTag('stats')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // main.ts
  await app.listen(process.env.PORT || 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
