import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { timeIdWithTimestamps } from '#/db/helpers.ts';

export const projectTable = pgTable('project', (t) => ({
	...timeIdWithTimestamps,
	order: integer().default(0),
	name: text().notNull(),
	tags: text().array().default([]),
}));
