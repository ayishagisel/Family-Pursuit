import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

// Create a PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
  } else {
    console.log('✅ PostgreSQL connection successful, server time:', res.rows[0].now);
  }
});

// Create a Drizzle instance with the pool
export const db = drizzle(pool);