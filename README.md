# Correlache - Headache and workout diary

## Prerequisites

```
mysql
```

## Installation

```
cd backend && npm install
cd ../frontend && npm install
```

## Database setup in `backend/`

1. Create the database - correlache
2. Configure the environment
   - Fill in `DB_USERNAME`, `DB_PASSWORD` and `JWT_SECRET`. The other `DB_*` values default to a local MySQL on port 3306 with the database name `correlache`.

3. Create the tables (migrations)

```
npm run migration:run:dev
```

This applies every file in `src/database/migrations/` in order and records them in the `migrations` table, so re-running only applies new ones.

4. Seed the lookup data

```
npm run seed
```

Fills the lookup tables (locations, symptoms, triggers, relief measures, muscle groups and muscles). Seeders upsert on their unique key, so running them again is safe.

### Changing the schema

1. Edit or add an entity (`src/**/*.entity.ts`).
2. Generate a migration, giving it a name:
   ```
   npm run migration:generate -- src/database/migrations/DescriptiveName
   ```
3. Review the generated file, then run `npm run migration:run:dev`.

Never edit a migration that has already been applied or merged; add a new one instead.

### Adding seed data

Seeders live in `src/database/seeds/` and must be named `*.seed.ts`. Add rows to the existing arrays, or create a new class implementing `Seeder`. Seed groups before anything that references them (e.g. muscle groups before muscles).

### Production (Heroku)

`JAWSDB_URL` is used instead of the `DB_*` variables when set. Migrations run in the release phase via `npm run migration:run` against the compiled `dist/`.
