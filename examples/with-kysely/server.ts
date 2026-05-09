import { PGlite } from '@electric-sql/pglite';
import { Kysely, PGliteDialect, sql } from 'kysely';
import { toKyselyOrderBy, toKyselyWhere } from 'agnostic-query/kysely/pg';
import type { QueryWhere } from 'agnostic-query/core/where';
import type { QuerySchema } from 'agnostic-query/core/index';
import type { DB, UserShape } from './schema';

const dialect = new PGliteDialect({
  pglite: new PGlite(),
});
const db = new Kysely<DB>({
	dialect,
});

await sql`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, age INTEGER, tags TEXT[])`.execute(db);
await sql`INSERT INTO users VALUES ('1', 'Alice', 30, ARRAY['admin', 'user'])`.execute(db);
await sql`INSERT INTO users VALUES ('2', 'Bob', 25, ARRAY['user'])`.execute(db);
await sql`INSERT INTO users VALUES ('3', 'Charlie', 35, ARRAY['admin'])`.execute(db);

Bun.serve({
	port: 3000,
	async fetch(req) {
		if (req.method !== 'POST') return new Response('send POST with JSON body', { status: 405 });

		const body = (await req.json()) as QuerySchema<UserShape>;
		const whereExpr = toKyselyWhere<UserShape, 'user'>(body.where);
		const orderBy = toKyselyOrderBy(db.selectFrom('user').where(whereExpr).selectAll(), body.orderBy);
		const rows = await orderBy.execute();

		return Response.json({ rows });
	},
});

console.log('Server running on http://localhost:3000');
