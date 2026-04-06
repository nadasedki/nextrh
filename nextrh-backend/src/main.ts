import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
 // Enable CORS so  React frontend can call this backend
  app.enableCors({
    origin: 'http://localhost:8080', //  frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // optional: allow cookies
  });

  await app.listen(3000); // backend port

app.useGlobalPipes(new ValidationPipe({
  transform: true // automatically converts strings to numbers
}));
}

bootstrap();
