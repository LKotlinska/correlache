import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { DataSource } from 'typeorm';
import { dbConfig } from '../../db.config.js';
import { hashPassword } from '../../common/password.js';
import { User } from '../../user/entities/user.entity.js';
import { replaceWithExampleData } from './load-example-data.js';

// Creates (or resets) a demo account with a year of workouts, headaches and medication ending yesterday.
// Needs the lookup data from `npm run seed` first. Running it again replaces the account's data.

const EXAMPLE_USER = { username: 'Data example', email: 'data@example.com', password: 'example123' };

// ESM has no __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === 'production') {
  throw new Error('The example user is for development only');
}

const dataSource = new DataSource({
  ...dbConfig(process.env),
  entities: [join(__dirname, '..', '..', '**', '*.entity{.ts,.js}')],
});

try {
  await dataSource.initialize();

  const summary = await dataSource.transaction(async (manager) => {
    // Reset the password too, so the documented login always works
    const passwordHash = await hashPassword(EXAMPLE_USER.password);
    let user = await manager.findOneBy(User, { email: EXAMPLE_USER.email });
    if (user) {
      await manager.update(User, user.id, { username: EXAMPLE_USER.username, password_hash: passwordHash, health_data_consent_at: new Date() });
    } else {
      user = await manager.save(manager.create(User, { username: EXAMPLE_USER.username, email: EXAMPLE_USER.email, password_hash: passwordHash, health_data_consent_at: new Date() }));
    }
    return replaceWithExampleData(manager, user.id, new Date());
  });

  console.log(
    `Seeded ${EXAMPLE_USER.email} (password: ${EXAMPLE_USER.password}) with ${summary.workouts} workouts, ${summary.headaches} headaches and ${summary.intakes} medication doses.`,
  );
} finally {
  if (dataSource.isInitialized) await dataSource.destroy();
}
