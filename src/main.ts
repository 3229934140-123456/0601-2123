import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.enableCors();
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`智慧体育训练服务已启动: http://localhost:${port}/api`);
}
bootstrap();
