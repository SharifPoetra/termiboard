import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables for Drizzle Kit
dotenv.config();

export default defineConfig({
  out: './drizzle',
  schema: './src/database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
