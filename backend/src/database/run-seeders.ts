import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { DataSource } from 'typeorm';
import { runSeeders } from 'typeorm-extension';
import { dbConfig } from '../db.config.js';

// ESM has no __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

const dataSource = new DataSource({
  ...dbConfig(process.env),
  entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
});

try {
  await dataSource.initialize();
  await runSeeders(dataSource, {
    seeds: [join(__dirname, 'seeds', '*{.ts,.js}')],
  });
} finally {
  if (dataSource.isInitialized) await dataSource.destroy();
}
