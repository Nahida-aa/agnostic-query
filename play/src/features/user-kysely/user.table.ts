import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const userTable = pgTable('user', {
	id: text().primaryKey(),
	name: text().notNull(),
	status: text(),
	age: integer(),
	createdAt: timestamp('created_at').defaultNow(),
});
