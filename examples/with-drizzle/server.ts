import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { toDrizzleWhere } from 'agnostic-query/drizzle';
import { whereSchema, users } from './schema';

const client = new PGlite();
const db = drizzle(client);

Bun.serve({
	port: 3000,
	async fetch(req) {
		if (req.method !== 'POST') return new Response('send POST with JSON body', { status: 405 });

		const body = await req.json();
		const parsed = whereSchema.safeParse(body);
		if (!parsed.success) {
			return Response.json({ error: parsed.error.issues }, { status: 400 });
		}

		const whereExpr = toDrizzleWhere(users, parsed.data);
		const sql = db.select().from(users).where(whereExpr).toSQL();

		return Response.json({ sql: sql.sql, params: sql.params });
	},
});

console.log('Server running on http://localhost:3000');
