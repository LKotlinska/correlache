# Correlache - Headache and workout diary

Correlache is a personal diary for logging headaches and workouts in one place. Record headache episodes (times, locations, symptoms, triggers and relief measures) next to your training, and look back over paged weeks to spot patterns between the two.

## Prerequisites

- Node.js 22.x (and npm)
- MySQL server, running locally

## Tech stack

- Angular 22 with Angular Material / CDK with TypeScript
- NestJS 12 (Express) with TypeScript
- TypeORM with MySQL
- Migrations and seeders via `typeorm-extension`

## Installation

```
cd backend && npm install
cd ../frontend && npm install
```

## Database setup in `backend/`

1. Create the database - correlache
2. Configure the environment
   - Copy the example file: `cp .env.example .env`
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

5. (Optional) Add an example account with data

```
npm run seed:example
```

Creates `data@example.com` (password `example123`) with a year of workouts and headaches ending yesterday, handy for trying out the insights. Running it again resets that account's password and replaces its data. It doesn't run when in production.

## Running the app

Start the backend and the frontend in separate terminals:

```
cd backend && npm run start:dev
cd frontend && npm start
```

### Production (Heroku)

- Deployed on Heroku (Node 22, JawsDB MySQL)

`JAWSDB_URL` is used instead of the `DB_*` variables when set. Migrations run in the release phase via `npm run migration:run` against the compiled `dist/`.
