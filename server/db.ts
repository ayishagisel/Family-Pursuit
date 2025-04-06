import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

// Create a PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a Drizzle instance with the pool
export const db = drizzle(pool);