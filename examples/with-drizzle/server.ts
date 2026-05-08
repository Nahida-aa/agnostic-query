import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { sql } from 'drizzle-orm';
import { toDrizzleOrderBy, toDrizzleWhere } from 'agnostic-query/drizzle';
import { whereSchema, usersTable } from './schema';

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
	  const users0 =	await db.execute(sql`select * from ${usersTable} where ${usersTable.id} = ${'123'}`);
		const whereExpr = toDrizzleWhere(usersTable, parsed.data);
		const users1Q =  db.select().from(usersTable).where(whereExpr).orderBy(...toDrizzleOrderBy(usersTable));
		const users1 = await users1Q
		const user1Sql = users1Q.toSQL();
		return Response.json({ sql: user1Sql.sql, params: user1Sql.params });
	},
});

console.log('Server running on http://localhost:3000');
