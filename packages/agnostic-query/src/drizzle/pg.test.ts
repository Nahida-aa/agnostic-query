import { describe, expect, it } from 'bun:test';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { toDrizzleWhere } from './pg.ts';

const users = pgTable('users', {
	id: text('id').primaryKey(),
	name: text('name'),
	age: integer('age'),
	tags: text('tags').array(),
	data: text('data'),
});

const db = drizzle(new PGlite());

const toSql = (whereExpr: ReturnType<typeof toDrizzleWhere>) => {
	return db.select().from(users).where(whereExpr).toSQL();
}

describe('toDrizzleWhere', () => {
	it('=', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['name'], op: '=', value: 'Alice' }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags", "data" from "users" where "users"."name" = $1`);
		expect(sql.params).toEqual(['Alice']);
	});

	it('>', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['age'], op: '>', value: 18 }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags", "data" from "users" where "users"."age" > $1`);
		expect(sql.params).toEqual([18]);
	});

	it('>=', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['age'], op: '>=', value: 18 }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags", "data" from "users" where "users"."age" >= $1`);
	});

	it('<', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['age'], op: '<', value: 18 }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags", "data" from "users" where "users"."age" < $1`);
	});

	it('<=', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['age'], op: '<=', value: 18 }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags", "data" from "users" where "users"."age" <= $1`);
	});

	it('like', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['name'], op: 'like', value: '%test%' }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags", "data" from "users" where "users"."name" like $1`);
	});

	it('ilike', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['name'], op: 'ilike', value: '%Test%' }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags", "data" from "users" where "users"."name" ilike $1`);
	});

	it('is null', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['name'], op: 'is null' }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags", "data" from "users" where "users"."name" is null`);
	});

	it('@> (contains)', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['tags'], op: '@>', value: ['admin'] }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags", "data" from "users" where "users"."tags" @> $1`);
	});

	it('<@ (contained by)', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['tags'], op: '<@', value: ['admin', 'user'] }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags", "data" from "users" where "users"."tags" <@ $1`);
	});

	it('&& (overlaps)', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['tags'], op: '&&', value: ['admin'] }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags", "data" from "users" where "users"."tags" && $1`);
	});

	it('in', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['id'], op: 'in', values: ['1', '2', '3'] }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags", "data" from "users" where "users"."id" in ($1, $2, $3)`);
		expect(sql.params).toEqual(['1', '2', '3']);
	});

	it('and', () => {
		const sql = toSql(toDrizzleWhere(users, {
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['age'], op: '>', value: 18 },
			],
		}));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags", "data" from "users" where ("users"."name" = $1 and "users"."age" > $2)`);
		expect(sql.params).toEqual(['Alice', 18]);
	});

	it('or', () => {
		const sql = toSql(toDrizzleWhere(users, {
			op: 'or',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['name'], op: '=', value: 'Bob' },
			],
		}));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags", "data" from "users" where ("users"."name" = $1 or "users"."name" = $2)`);
	});

	it('not', () => {
		const sql = toSql(toDrizzleWhere(users, {
			op: 'not',
			condition: { field: ['age'], op: '<', value: 18 },
		}));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags", "data" from "users" where not "users"."age" < $1`);
	});

	it('nested and/or/not', () => {
		const sql = toSql(toDrizzleWhere(users, {
			op: 'and',
			conditions: [
				{
					op: 'or',
					conditions: [
						{ field: ['name'], op: 'like', value: '%test%' },
						{ op: 'not', condition: { field: ['age'], op: '=', value: 0 } },
					],
				},
				{ field: ['id'], op: 'in', values: ['a', 'b'] },
			],
		}));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags", "data" from "users" where (("users"."name" like $1 or not "users"."age" = $2) and "users"."id" in ($3, $4))`);
	});

	it('undefined input returns undefined', () => {
		expect(toDrizzleWhere(users)).toBeUndefined();
	});

	it('returns undefined for non-existent column', () => {
		expect(toDrizzleWhere(users, { field: ['unknown'], op: '=', value: 'x' } as any)).toBeUndefined();
	});

	it('handles multi-segment JSON path', () => {
		const sql = toSql(
			toDrizzleWhere(users, {
				field: ['data', 'address', 'city'],
				op: '=',
				value: 'NYC',
			}),
		);
		expect(sql.sql).toContain(`"data"->'address'->>'city'`);
	});
});

import { toDrizzleOrderBy } from './pg.ts';

describe('toDrizzleOrderBy', () => {
	it('single asc', () => {
		const result = toDrizzleOrderBy(users, [
			{ field: ['name'], direction: 'asc' },
		]);
		const sql = db.select().from(users).orderBy(...result!).toSQL();
		expect(sql.sql).toContain('order by "users"."name"');
	});

	it('single desc', () => {
		const result = toDrizzleOrderBy(users, [
			{ field: ['age'], direction: 'desc' },
		]);
		const sql = db.select().from(users).orderBy(...result!).toSQL();
		expect(sql.sql).toContain('order by "users"."age" desc');
	});

	it('multiple clauses', () => {
		const result = toDrizzleOrderBy(users, [
			{ field: ['name'], direction: 'asc' },
			{ field: ['age'], direction: 'desc' },
		]);
		const sql = db.select().from(users).orderBy(...result!).toSQL();
		expect(sql.sql).toContain('order by "users"."name" asc, "users"."age" desc');
	});

	it('null returns empty array', () => {
		expect(toDrizzleOrderBy(users)).toEqual([]);
	});
});
