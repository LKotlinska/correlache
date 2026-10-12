import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env'}),
    TypeOrmModule.forRoot({
      type: 'mysql',
      url: process.env.JAWSDB_URL,
      host: process.env.DB_HOST,
      port: Number(process.env.PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [], // Fill with your entities 
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    // Lets Nest server hand out Angular app, so one Heroku app serves both the website and the API.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist', 'frontend', 'browser'),
      exclude: ['/api/{*path}'],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
