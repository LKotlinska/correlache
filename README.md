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

Fills the lookup tables (locations, symptoms, triggers, relief measures, muscle groups and muscles, as well as exercises). Seeders upsert on their unique key, so running them again is safe.

### Production (Heroku)

`JAWSDB_URL` is used instead of the `DB_*` variables when set. Migrations run in the release phase via `npm run migration:run` against the compiled `dist/`.
