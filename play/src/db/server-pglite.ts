import { PGlite } from '@electric-sql/pglite';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema.ts';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export async function getDb() {
	if (db) return db;

	const client = new PGlite();

	await client.query(`
		CREATE TABLE IF NOT EXISTS posts (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			body TEXT NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)
	`);

	db = drizzle(client, { schema });

	const count = await db
		.select({ count: sql<number>`COUNT(*)::int` })
		.from(schema.posts);

	if (count[0].count === 0) {
		for (let i = 0; i < 100; i++) {
			await db.insert(schema.posts).values({
				id: crypto.randomUUID(),
				title: faker.lorem.sentence({ min: 4, max: 12 }),
				body: faker.lorem.paragraphs({ min: 2, max: 5 }, '\n\n'),
				createdAt: faker.date.past({ years: 1 }),
			});
		}
	}

	return db;
}
