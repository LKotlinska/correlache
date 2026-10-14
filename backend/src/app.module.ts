import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'
import { ServeStaticModule } from '@nestjs/serve-static';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { UserModule } from './user/user.module.js';
import { AuthenticationModule } from '@nestjs/authentication';
import { AuthModule } from './auth/auth.module.js';
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
        migrations: [join(__dirname, 'migrations', '*.js')],
        migrationsRun: true,
        synchronize: false,
      }),
    }),
    AuthenticationModule.forRoot({
      // No persistent SessionStore yet: sessions live in memory, so they are lost on dyno restart.
      // Required here because the module refuses in-memory storage when NODE_ENV=production.
      allowInMemoryStorage: true,
      session: {
        absoluteTtl: '14d', // signed out after 14 days, however active
        idleTtl: '3d', // or after 3 days without a request
      },
    }),
    // Lets Nest server hand out Angular app, so Heroku serves both the website and the API.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist', 'frontend', 'browser'),
      exclude: ['/api/{*path}'],
    }),
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
