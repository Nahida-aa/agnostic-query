import { PGlite } from '@electric-sql/pglite';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { nanoid } from 'nanoid';
import type { Post } from '#/db/schema.ts';
import * as schema from './schema.ts';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export async function getDb() {
	if (db) return db;

	const client = new PGlite();

	await client.query(`
		CREATE TABLE IF NOT EXISTS post (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			body TEXT NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)
	`);

	db = drizzle(client, { schema });

	const count = await db
		.select({ count: sql<number>`COUNT(*)::int` })
		.from(schema.post);
	const allPosts: Post[] = [];
	if (count[0].count === 0) {
		for (let i = 0; i < 100; i++) {
			allPosts.push({
				id: nanoid(),
				title: faker.lorem.sentence({ min: 4, max: 12 }),
				body: faker.lorem.paragraphs({ min: 2, max: 5 }, '\n\n'),
				created_at: faker.date.past({ years: 1 }),
			});
		}
	}
	await db.insert(schema.post).values(allPosts);

	return db;
}
