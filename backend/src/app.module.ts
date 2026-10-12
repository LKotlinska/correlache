import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'
import { ServeStaticModule } from '@nestjs/serve-static';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { UserController } from './user/user.controller.js';
import { UserModule } from './user/user.module.js';
import { dbConfig } from './db.config.js';

// ESM has no __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

@Module({
  imports: [
    // isGlobal makes ConfigService injectable everywhere without re-importing ConfigModule
    ConfigModule.forRoot({ isGlobal: true}),
    // The async factory runs after ConfigModule is ready, so process.env is populated
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...dbConfig(process.env),
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV === 'development',
      }),
}),
    // Lets Nest server hand out Angular app, so Heroku serves both the website and the API.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist', 'frontend', 'browser'),
      exclude: ['/api/{*path}'],
    }),
    UserModule,
  ],
  controllers: [AppController, UserController],
  providers: [AppService],
})
export class AppModule {}
