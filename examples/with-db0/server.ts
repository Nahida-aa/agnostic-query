import { createDatabase } from 'db0';
import pgliteConnector from 'db0/connectors/pglite';
import { toDb0Where } from '../../packages/agnostic-query/src/db0/pg';
import type { QueryWhere } from '../../packages/agnostic-query/src/core/where';

const db = createDatabase(pgliteConnector());

await db.sql`CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT, age INTEGER, tags TEXT[])`;
await db.sql`INSERT INTO users VALUES ('1', 'Alice', 30, ARRAY['admin', 'user'])`;
await db.sql`INSERT INTO users VALUES ('2', 'Bob', 25, ARRAY['user'])`;
await db.sql`INSERT INTO users VALUES ('3', 'Charlie', 35, ARRAY['admin'])`;

Bun.serve({
	port: 3000,
	async fetch(req) {
		if (req.method !== 'POST') return new Response('send POST with JSON body', { status: 405 });

		const body = await req.json();
		const result = toDb0Where(body as QueryWhere | null);
		if (!result) return Response.json({ error: 'invalid query' }, { status: 400 });

		const { sql, params } = result;
		const rows = await db.prepare(`SELECT * FROM users WHERE ${sql}`).all(...params);

		return Response.json({ sql, params, rows });
	},
});

console.log('Server running on http://localhost:3000');
