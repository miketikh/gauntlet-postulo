import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection configuration
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/steno_dev';

// Create PostgreSQL client with connection pooling
const client = postgres(connectionString, {
  max: 10, // Maximum pool size
  idle_timeout: 20, // Idle connection timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds
});

// Create Drizzle instance
export const db = drizzle(client, { schema });

// Export for type inference
export type Database = typeof db;
