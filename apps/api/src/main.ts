import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { json, urlencoded } from "express";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.use(json({ limit: "50mb" }));
  app.use(urlencoded({ extended: true, limit: "50mb" }));
  app.use(cookieParser());

  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000",
      process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001",
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "stripe-signature",
      "Idempotency-Key",
      "idempotency-key",
      "X-Requested-With",
      "Accept",
    ],
  });

  app.setGlobalPrefix("api/v1");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  // Section 97: Graceful Shutdown for SIGTERM/SIGINT
  app.enableShutdownHooks();

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 BookMyShow NestJS API is listening on port ${port} (prefix: /api/v1)`);
}

bootstrap();
