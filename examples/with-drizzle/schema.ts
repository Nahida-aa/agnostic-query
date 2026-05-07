import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createWhereSchema } from 'agnostic-query/zod';

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	name: text('name'),
	age: integer('age'),
	tags: text('tags'),
});

export type User = typeof users.$inferSelect;
export type UserShape = {
	[K in keyof User]: User[K];
};

export const whereSchema = createWhereSchema<UserShape>()(['name', 'age']);
export const looseSchema = createWhereSchema<UserShape>()();
