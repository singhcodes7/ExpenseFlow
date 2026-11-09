import { Pool } from "pg";

const ssl = process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined;

export const pool = new Pool(
    process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl,
          }
        : {
              user: process.env.DB_USER,
              host: process.env.DB_HOST,
              database: process.env.DB_NAME,
              password: process.env.DB_PASSWORD,
              port: Number(process.env.DB_PORT || 5432),
              ssl,
          }
);