import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ServeStaticModule } from '@nestjs/serve-static';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// ESM has no __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

@Module({
  imports: [
    // isGlobal makes ConfigService injectable everywhere without re-importing ConfigModule
    ConfigModule.forRoot({ isGlobal: true}),
    // The async factory runs after ConfigModule is ready and gets ConfigService injected
    // Prevents process.env values being undefined
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Heroku (JawsDB) provides a single URL; locally we fall back to .env
        const url = config.get<string>('JAWSDB_URL');
        const base = {
          type: 'mysql' as const,
          autoLoadEntities: true,
          synchronize: process.env.NODE_ENV === 'development',
        };
        return url ? { ...base, url } : {
          ...base,
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        };
      },
}),
    // Lets Nest server hand out Angular app, so Heroku serves both the website and the API.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist', 'frontend', 'browser'),
      exclude: ['/api/{*path}'],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
