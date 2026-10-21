import type { DataSourceOptions } from 'typeorm';

export function dbConfig(env: NodeJS.ProcessEnv): DataSourceOptions {
  const base = { type: 'mysql' as const, timezone: 'Z' };
  return env.JAWSDB_URL
    ? { ...base, url: env.JAWSDB_URL }
    : {
        ...base,
        host: env.DB_HOST,
        port: Number(env.DB_PORT),
        username: env.DB_USERNAME,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
      };
}
