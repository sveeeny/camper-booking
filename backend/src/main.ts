import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 👉 CORS aktivieren
  app.enableCors();

  // 👉 Globalen ValidationPipe aktivieren
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // ✅ Backend starten
  await app.listen(3000);
  Logger.log('🚀 Server läuft auf http://localhost:3000');

  // 🔍 Alle registrierten Routen anzeigen
  const server = app.getHttpServer();
  const router = server._events?.request?._router;

  if (router) {
    Logger.log('📌 Registrierte Routen:');
    router.stack.forEach((layer) => {
      if (layer.route) {
        Logger.log(`👉 ${layer.route.stack[0].method.toUpperCase()} ${layer.route.path}`);
      }
    });
  } else {
    Logger.warn('⚠️ Keine Routen gefunden! Überprüfe deine Controller.');
  }
}
bootstrap();
