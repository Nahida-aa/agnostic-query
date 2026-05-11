import { createDatabase } from 'db0';
import pgliteConnector from 'db0/connectors/pglite';
import { toDb0Where, toDb0 } from 'agnostic-query/db0/pg';
import { newWhere, type QuerySchema, type QueryWhere } from 'agnostic-query';	


const db = createDatabase(pgliteConnector());

await db.sql`CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT, age INTEGER, tags TEXT[])`;
await db.sql`INSERT INTO users VALUES ('1', 'Alice', 30, ARRAY['admin', 'user'])`;
await db.sql`INSERT INTO users VALUES ('2', 'Bob', 25, ARRAY['user'])`;
await db.sql`INSERT INTO users VALUES ('3', 'Charlie', 35, ARRAY['admin'])`;
type User = {
	id: string;
	name: string;
	age: number;
	tags: string[];
};
Bun.serve({
	port: 3000,
	async fetch(req) {
		if (req.method !== 'POST') return new Response('send POST with JSON body', { status: 405 });

		const body = (await req.json()) as QuerySchema<User>;
		const rows = await toDb0(db, body)

		return Response.json(rows);
	},
});

console.log('Server running on http://localhost:3000');
