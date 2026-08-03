import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { BadRequestException, ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as passport from 'passport';
import * as express from 'express';
import { json, urlencoded } from 'express';
import * as nodeCrypto from 'crypto';

if (!globalThis.crypto) {
  globalThis.crypto = {
    // minimale Polyfill-Definition
    randomUUID: nodeCrypto.randomUUID,
  } as Crypto;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 👉 CORS aktivieren
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://192.168.1.10:5173',
      'http://172.27.219.139:5173',
      'http://localhost',
      'https://booking.byherger.ch',
    ],
  });

  // TODO: evtl👉 Globalen ValidationPipe aktivieren
  // app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // 🛡️ Nur für Stripe: raw Body
  app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

  // 🔁 Alle normalen Routen
  app.use(json());
  app.use(urlencoded({ extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
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
      'Authorization',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(3000, '0.0.0.0');
  Logger.log(`🚀 Server läuft auf http://localhost:3000`);
  Logger.log(`📖 Swagger UI verfügbar unter http://localhost:3000/api`);
}

void bootstrap();
