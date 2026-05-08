import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { createWhereSchema } from 'agnostic-query/zod';

export const users = pgTable('users', {
	id: text('id').primaryKey(),
	name: text('name'),
	age: integer('age'),
	tags: text('tags').array(),
});

export type User = typeof users.$inferSelect;
export type UserShape = {
	[K in keyof User]: User[K];
};

export const whereSchema = createWhereSchema<UserShape>();
export const looseSchema = createWhereSchema<UserShape>();
