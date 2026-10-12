import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { DataSource } from 'typeorm';
import { dbConfig } from './db.config.js';

// ESM has no __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

export default new DataSource({
  ...dbConfig(process.env),
  entities: [join(__dirname, '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
});