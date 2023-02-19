import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  const frontendUrl = configService.get('FRONT_END_URL');

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(port);

  app.enableCors({
    credentials: true,
    origin: [frontendUrl, 'https://studio.apollographql.com'],
  });
  console.log(
    `[${
      process.env.NODE_ENV
    }] Application is running on: ${await app.getUrl()}`,
  );
}
bootstrap();
