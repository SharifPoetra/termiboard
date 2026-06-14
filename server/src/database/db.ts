import { FastifyInstance } from 'fastify';
import pg from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.ts';

export type TermiDb = NodePgDatabase<typeof schema>;

export const initDatabase = async (app: FastifyInstance): Promise<void> => {
  const pool = new pg.Pool({
    connectionString: app.config.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Test the physical connection first
    await pool.query('SELECT NOW()');
    app.log.info('✨ Physical connection to the Database established.');

    const db = drizzle(pool, { schema });

    // --- DECORATE FASTIFY INSTANCE ---
    // This allows us to access the database anywhere via app.db
    app.decorate('db', db);
    app.log.info('🚀 Drizzle ORM attached successfully to app.db');
  } catch (err: any) {
    app.log.error('❌ Database initialization failed:', err);
    process.exit(1);
  }
};
