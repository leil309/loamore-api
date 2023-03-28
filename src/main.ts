import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

BigInt.prototype['toJSON'] = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  const frontendUrl = configService.get('FRONT_END_URL');

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
