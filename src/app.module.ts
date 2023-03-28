import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { join } from 'path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { PrismaModule } from 'src/prisma/prisma.modules';
import { CharacterModule } from 'src/character/character.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'prod' ? '.env.prod' : '.env',
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        playground: false,
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
        cors: {
          origin: [
            configService.get('FRONT_END_URL'),
            'https://studio.apollographql.com',
          ],
          credentials: true,
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    CharacterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
