import { PGlite } from '@electric-sql/pglite';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { nanoid } from 'nanoid';
import type { Post } from '#/db/schema.ts';
import * as schema from './schema.ts';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export async function getDb() {
	if (db) return db;

	const dataDir = process.env.PGLITE_DATA_DIR ?? './pglite-data';
	const client = new PGlite(dataDir);
	await client.waitReady;

	db = drizzle(client, { schema });

	await migrate(db, { migrationsFolder: './drizzle' });

	const count = await db
		.select({ count: sql<number>`COUNT(*)::int` })
		.from(schema.post);
	if (count[0].count === 0) {
		const allPosts: Post[] = [];
		for (let i = 0; i < 100; i++) {
			allPosts.push({
				id: nanoid(),
				title: faker.lorem.sentence({ min: 4, max: 12 }),
				body: faker.lorem.paragraphs({ min: 2, max: 5 }, '\n\n'),
				created_at: faker.date.past({ years: 1 }),
			});
		}
		await db.insert(schema.post).values(allPosts);
	}

	return db;
}
