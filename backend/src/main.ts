import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { BadRequestException, ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as passport from 'passport';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Reflector } from '@nestjs/core';
import { AppDataSource } from 'data-source';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const reflector = app.get(Reflector); // ✅ Reflector holen

  // 👉 CORS aktivieren
  app.enableCors();

  // 👉 Globalen ValidationPipe aktivieren
  //app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  console.log("⚠️ ValidationPipe wurde aktiviert!");
  app.useGlobalPipes(
      new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        console.error('🚨 Validierungsfehler:', errors);
        if (errors.length === 0) {
          console.log('✅ ValidationPipe ist aktiv, aber keine Fehler gefunden.');
        }
        return new BadRequestException(errors);
      },
    }),
  );
  


  // 🚀 **Passport Middleware aktivieren**
  app.use(passport.initialize());

  // 📌 Swagger-Dokumentation einrichten mit Bearer-Auth
  const config = new DocumentBuilder()
    .setTitle('Camper Booking API')
    .setDescription('API-Dokumentation für das Camper Booking Backend')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'Authorization'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  Logger.log(`🚀 Server läuft auf http://localhost:3000`);
  Logger.log(`📖 Swagger UI verfügbar unter http://localhost:3000/api`);

  // 📌 Sicherstellen, dass der Router existiert
  const server = app.getHttpServer();
  const router = server?._events?.request?._router;

  if (router && router.stack) {
    Logger.log('📌 Registrierte Routen:');
    router.stack.forEach((layer) => {
      if (layer.route) {
        Logger.log(`➡️ ${layer.route.stack[0].method.toUpperCase()} ${layer.route.path}`);
      }
    });
  } else {
    Logger.warn('⚠️ Keine registrierten Routen gefunden! Überprüfe deine Controller.');
  }

  AppDataSource.initialize()
  .then(() => console.log('✅ Datenbankverbindung erfolgreich!'))
  .catch((err) => console.error('❌ Fehler bei der Datenbankverbindung:', err));



}

bootstrap();
