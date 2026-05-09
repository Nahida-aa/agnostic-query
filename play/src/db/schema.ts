import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';

export const todos = pgTable('todos', {
	id: serial().primaryKey(),
	title: text().notNull(),
	createdAt: timestamp('created_at').defaultNow(),
});

export const post = pgTable('post', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	body: text('body').notNull(),
	created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
export const postSchema = createSelectSchema(post);

export type Post = typeof post.$inferSelect;
