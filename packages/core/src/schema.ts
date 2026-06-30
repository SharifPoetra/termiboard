import { boolean, pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

// Users Table Schema
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  otpCode: varchar('otp_code', { length: 6 }),
  otpExpiresAt: timestamp('otp_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Boards Table Schema
export const boards = pgTable('boards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Columns Table Schema
export const columns = pgTable('columns', {
  id: uuid('id').primaryKey().defaultRandom(),
  boardId: uuid('board_id')
    .references(() => boards.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  position: text('position').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Cards Table Schema
export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  columnId: uuid('column_id')
    .references(() => columns.id, { onDelete: 'cascade' })
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  position: text('position').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Board Members Table Schema (Junction Table for Colaboration)
export const boardMembers = pgTable('board_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  boardId: uuid('board_id')
    .references(() => boards.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  role: varchar('role', { length: 20 }).default('member').notNull(), // Can be 'admin' or 'member'
  status: varchar('status', { length: 20 }).default('pending').notNull(), // FLAG: 'pending' or 'active'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
